using System;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Web.Http;
using ControlActividades.Models;
using ControlActividades.Services;

namespace ControlActividades.Controllers
{
    public class ActivitiesController : ApiController
    {
        private readonly DatabaseService _db = new DatabaseService();
        private readonly string[] _months = { "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre" };

        private int GetUserId()
        {
            var session = System.Web.HttpContext.Current?.Session;
            if (session == null) return 0;
            var user = session["UserId"];
            return user != null ? (int)user : 0;
        }

        [HttpGet]
        [Route("api/activities/project/{projectId}")]
        public IHttpActionResult GetActivities(int projectId)
        {
            var userId = GetUserId();
            if (userId == 0) return Unauthorized();

            var project = _db.GetProjectById(projectId, userId);
            if (project == null) return NotFound();

            return Ok(_db.GetActivitiesByProject(projectId, userId));
        }

        [HttpPost]
        [Route("api/activities")]
        public IHttpActionResult CreateActivity([FromBody] Activity model)
        {
            var userId = GetUserId();
            if (userId == 0) return Unauthorized();

            if (model == null || model.ProjectId == 0 || string.IsNullOrWhiteSpace(model.Description))
                return BadRequest("Campos requeridos");

            var project = _db.GetProjectById(model.ProjectId, userId);
            if (project == null)
                return BadRequest("Proyecto no encontrado");

            model.UserId = userId;
            var activity = _db.CreateActivity(model);
            if (activity == null)
                return BadRequest("Error al crear actividad");

            return Created($"api/activities/{activity.Id}", activity);
        }

        [HttpGet]
        [Route("api/report/excel")]
        public HttpResponseMessage DownloadExcel(int projectId, int? month, int? year)
        {
            var userId = GetUserId();
            if (userId == 0) return new HttpResponseMessage(HttpStatusCode.Unauthorized);

            var project = _db.GetProjectById(projectId, userId);
            if (project == null) return new HttpResponseMessage(HttpStatusCode.NotFound);

            var m = month ?? DateTime.Now.Month;
            var y = year ?? DateTime.Now.Year;

            var activities = _db.GetReportData(projectId, userId, m, y);

            var csv = "Fecha,Descripción,Horas,Minutos,Icono,Importancia,Usuario\n" +
                string.Join("\n", activities.Select(a =>
                    $"\"{a.Date:yyyy-MM-dd}\",\"{a.Description}\",\"{a.Hours}\",\"{a.Minutes}\",\"{a.Icon}\",\"{a.Importance}\",\"{a.Username}\""));

            var username = System.Web.HttpContext.Current.Session["Username"]?.ToString() ?? "user";
            var filename = $"{project.Name}_{y}_{m:D2}.csv";

            var response = new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(csv, System.Text.Encoding.UTF8)
            };
            response.Content.Headers.ContentType = new MediaTypeHeaderValue("text/csv");
            response.Content.Headers.ContentDisposition = new ContentDispositionHeaderValue("attachment")
            {
                FileName = filename
            };

            return response;
        }
    }
}
