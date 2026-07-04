using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Web.Http;
using ControlActividades.Models;
using ControlActividades.Services;

namespace ControlActividades.Controllers
{
    public class ProjectsController : ApiController
    {
        private readonly DatabaseService _db = new DatabaseService();

        private int GetUserId() => AccountController.GetUserIdFromCookie();

        [HttpGet]
        [Route("api/projects")]
        public IHttpActionResult GetProjects()
        {
            var userId = GetUserId();
            if (userId == 0) return Unauthorized();
            return Ok(_db.GetProjectsByUser(userId));
        }

        [HttpGet]
        [Route("api/projects/{id}")]
        public IHttpActionResult GetProject(int id)
        {
            var userId = GetUserId();
            if (userId == 0) return Unauthorized();

            var project = _db.GetProjectById(id, userId);
            if (project == null) return NotFound();
            return Ok(project);
        }

        [HttpPost]
        [Route("api/projects")]
        public IHttpActionResult CreateProject([FromBody] Project model)
        {
            var userId = GetUserId();
            if (userId == 0) return Unauthorized();

            if (model == null || string.IsNullOrWhiteSpace(model.Name))
                return BadRequest("Nombre requerido");

            var project = _db.CreateProject(model.Name.Trim(), userId);
            if (project == null)
                return BadRequest("Ya existe un proyecto con ese nombre");

            return Created($"api/projects/{project.Id}", project);
        }

        [HttpGet]
        [Route("api/dashboard/summary")]
        public IHttpActionResult GetDashboardSummary(int? month, int? year)
        {
            var userId = GetUserId();
            if (userId == 0) return Unauthorized();

            var m = month ?? DateTime.Now.Month;
            var y = year ?? DateTime.Now.Year;

            return Ok(_db.GetDashboardSummary(userId, m, y));
        }
    }
}
