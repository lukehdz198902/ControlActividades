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

            return RedirectToAction("Index", "Home");
        }

        [HttpPost]
        public JsonResult Logout()
        {
            Session.Clear();
            Session.Abandon();
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
