using System;

namespace ControlActividades.Models
{
    public class Activity
    {
        public int Id { get; set; }
        public int ProjectId { get; set; }
        public int UserId { get; set; }
        public DateTime Date { get; set; }
        public string Description { get; set; }
        public int Hours { get; set; }
        public int Minutes { get; set; }
        public string Icon { get; set; }
        public string Importance { get; set; }
        public DateTime CreatedAt { get; set; }
        public string Username { get; set; }
    }
}
