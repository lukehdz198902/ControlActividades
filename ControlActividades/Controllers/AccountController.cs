using System;
using System.Web;
using System.Web.Mvc;
using ControlActividades.Services;

namespace ControlActividades.Controllers
{
    public class AccountController : Controller
    {
        private readonly DatabaseService _db = new DatabaseService();

        [HttpPost]
        public ActionResult Login(string username, string password)
        {
            if (string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(password))
            {
                ViewBag.Error = "Campos requeridos";
                return View("~/Views/Home/Index.cshtml");
            }

            var user = _db.ValidateUser(username);
            if (user == null || !PasswordHelper.VerifyPassword(password, user.PasswordHash))
            {
                ViewBag.Error = "Usuario o contraseña incorrectos";
                return View("~/Views/Home/Index.cshtml");
            }

            Session["UserId"] = user.Id;
            Session["Username"] = user.Username;
            SetAuthCookie(user.Id.ToString(), user.Username);

            return RedirectToAction("Index", "Home");
        }

        [HttpPost]
        public JsonResult Logout()
        {
            Session.Clear();
            Session.Abandon();
            ClearAuthCookie();
            return Json(new { success = true });
        }

        public JsonResult CurrentUser()
        {
            var userId = GetUserIdFromCookie();
            var username = GetUsernameFromCookie();
            if (userId > 0 && !string.IsNullOrEmpty(username))
            {
                return Json(new
                {
                    loggedIn = true,
                    user = new { id = userId, username }
                }, JsonRequestBehavior.AllowGet);
            }
            if (Session["UserId"] != null)
            {
                return Json(new
                {
                    loggedIn = true,
                    user = new { id = (int)Session["UserId"], username = (string)Session["Username"] }
                }, JsonRequestBehavior.AllowGet);
            }
            return Json(new { loggedIn = false }, JsonRequestBehavior.AllowGet);
        }

        private void SetAuthCookie(string userId, string username)
        {
            var cookie = new HttpCookie("AuthUser", userId)
            {
                HttpOnly = true,
                SameSite = SameSiteMode.Lax,
                Path = "/"
            };
            Response.Cookies.Add(cookie);
            var userCookie = new HttpCookie("AuthUsername", username ?? "")
            {
                HttpOnly = true,
                SameSite = SameSiteMode.Lax,
                Path = "/"
            };
            Response.Cookies.Add(userCookie);
        }

        private void ClearAuthCookie()
        {
            foreach (var name in new[] { "AuthUser", "AuthUsername" })
            {
                if (Request.Cookies[name] != null)
                {
                    var cookie = new HttpCookie(name)
                    {
                        Expires = DateTime.Now.AddDays(-1),
                        Path = "/"
                    };
                    Response.Cookies.Add(cookie);
                }
            }
        }

        internal static int GetUserIdFromCookie()
        {
            var ctx = System.Web.HttpContext.Current;
            if (ctx?.Request.Cookies["AuthUser"] != null &&
                int.TryParse(ctx.Request.Cookies["AuthUser"].Value, out int userId))
                return userId;
            return 0;
        }

        internal static string GetUsernameFromCookie()
        {
            return System.Web.HttpContext.Current?.Request.Cookies["AuthUsername"]?.Value ?? "";
        }
    }
}
