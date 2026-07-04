using System;
using System.Web;
using System.Web.Mvc;
using System.Web.Security;
using ControlActividades.Services;

namespace ControlActividades.Controllers
{
    public class AccountController : Controller
    {
        private readonly DatabaseService _db = new DatabaseService();

        public ActionResult Login()
        {
            return View();
        }

        [HttpPost]
        public JsonResult Login(string username, string password)
        {
            if (string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(password))
                return Json(new { success = false, error = "Campos requeridos" });

            var user = _db.ValidateUser(username);
            if (user == null || !PasswordHelper.VerifyPassword(password, user.PasswordHash))
                return Json(new { success = false, error = "Usuario o contraseña incorrectos" });

            Session["UserId"] = user.Id;
            Session["Username"] = user.Username;

            var ticket = new FormsAuthenticationTicket(1, user.Username, DateTime.Now, DateTime.Now.AddDays(7), false, user.Id.ToString());
            var cookie = new HttpCookie(FormsAuthentication.FormsCookieName, FormsAuthentication.Encrypt(ticket));
            Response.Cookies.Add(cookie);

            return Json(new { success = true, user = new { id = user.Id, username = user.Username } });
        }

        [HttpPost]
        public JsonResult Logout()
        {
            Session.Clear();
            Session.Abandon();
            FormsAuthentication.SignOut();
            return Json(new { success = true });
        }

        public JsonResult CurrentUser()
        {
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
    }
}
