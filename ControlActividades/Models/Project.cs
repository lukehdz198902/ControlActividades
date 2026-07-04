using System;

namespace ControlActividades.Models
{
    public class Project
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public int UserId { get; set; }
        public DateTime CreatedAt { get; set; }
        public double MonthHours { get; set; }
        public double TotalHours { get; set; }
        public int ActivityCount { get; set; }
    }
}
