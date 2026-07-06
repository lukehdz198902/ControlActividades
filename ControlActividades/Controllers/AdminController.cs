using System;
using System.Linq;
using System.Text.RegularExpressions;
using System.Web.Http;
using ControlActividades.Models;
using ControlActividades.Services;

namespace ControlActividades.Controllers
{
    [RoutePrefix("api/admin")]
    public class AdminController : ApiController
    {
        private readonly DatabaseService _db = new DatabaseService();

        private static readonly Regex PasswordRegex = new Regex(@"^(?=.*[A-Z])(?=.*\d)(?=.*[*_#$]).{8,}$");

        private bool IsAdmin()
        {
            var role = AccountController.GetRoleFromCookie();
            return role == "admin";
        }

        private string ValidatePassword(string password)
        {
            if (string.IsNullOrWhiteSpace(password))
                return "La contraseña es requerida";
            if (password.Length < 8)
                return "La contraseña debe tener al menos 8 caracteres";
            if (!password.Any(char.IsUpper))
                return "La contraseña debe contener al menos una mayúscula";
            if (!password.Any(char.IsDigit))
                return "La contraseña debe contener al menos un número";
            if (!password.Any(c => "*_#$".Contains(c)))
                return "La contraseña debe contener al menos un símbolo: * _ # $";
            return null;
        }

        [HttpGet]
        [Route("users")]
        public IHttpActionResult GetUsers()
        {
            try
            {
                if (!IsAdmin()) return Unauthorized();
                return Ok(_db.GetAllUsers());
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        [HttpPost]
        [Route("users")]
        public IHttpActionResult CreateUser([FromBody] dynamic model)
        {
            try
            {
                if (!IsAdmin()) return Unauthorized();

                string username = model.username;
                string password = model.password;
                string role = model.role ?? "user";

                if (string.IsNullOrWhiteSpace(username))
                    return BadRequest("El nombre de usuario es requerido");

                var pwdError = ValidatePassword(password);
                if (pwdError != null)
                    return BadRequest(pwdError);

                if (role != "admin" && role != "user")
                    return BadRequest("Rol inválido (admin o user)");

                var passwordHash = PasswordHelper.HashPassword(password);
                var user = _db.CreateUser(username.Trim(), passwordHash, role);

                if (user == null)
                    return BadRequest("El nombre de usuario ya existe");

                return Created($"api/admin/users/{user.Id}", user);
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        [HttpPut]
        [Route("users/{id}/password")]
        public IHttpActionResult UpdatePassword(int id, [FromBody] dynamic model)
        {
            try
            {
                if (!IsAdmin()) return Unauthorized();

                string newPassword = model.password;
                var pwdError = ValidatePassword(newPassword);
                if (pwdError != null)
                    return BadRequest(pwdError);

                var passwordHash = PasswordHelper.HashPassword(newPassword);
                var result = _db.UpdateUserPassword(id, passwordHash);

                if (!result)
                    return BadRequest("Usuario no encontrado");

                return Ok(new { success = true });
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        [HttpPut]
        [Route("users/{id}")]
        public IHttpActionResult UpdateUser(int id, [FromBody] dynamic model)
        {
            try
            {
                if (!IsAdmin()) return Unauthorized();

                string newUsername = model.username;
                string newRole = model.role ?? "user";

                if (string.IsNullOrWhiteSpace(newUsername))
                    return BadRequest("El nombre de usuario es requerido");

                if (newRole != "admin" && newRole != "user")
                    return BadRequest("Rol inválido (admin o user)");

                var user = _db.UpdateUser(id, newUsername.Trim(), newRole);

                if (user == null)
                    return BadRequest("El nombre de usuario ya existe o usuario no encontrado");

                return Ok(user);
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        [HttpGet]
        [Route("users/{id}/activities")]
        public IHttpActionResult GetUserActivities(int id, int? month, int? year)
        {
            try
            {
                if (!IsAdmin()) return Unauthorized();

                var m = month ?? DateTime.Now.Month;
                var y = year ?? DateTime.Now.Year;

                return Ok(_db.GetUserActivities(id, m, y));
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        [HttpGet]
        [Route("dashboard")]
        public IHttpActionResult GetDashboard(int? month, int? year)
        {
            try
            {
                if (!IsAdmin()) return Unauthorized();

                var m = month ?? DateTime.Now.Month;
                var y = year ?? DateTime.Now.Year;

                var data = _db.GetAdminDashboard(m, y);

                var grouped = data
                    .GroupBy(d => new { d.UserId, d.Username })
                    .Select(g => new
                    {
                        userId = g.Key.UserId,
                        username = g.Key.Username,
                        projects = g.Select(p => new
                        {
                            projectId = p.ProjectId,
                            projectName = p.ProjectName,
                            totalHours = p.TotalHours,
                            activityCount = p.ActivityCount
                        }),
                        totalHours = Math.Round(g.Sum(p => p.TotalHours), 2)
                    })
                    .OrderBy(u => u.username)
                    .ToList();

                return Ok(grouped);
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }
    }
}
