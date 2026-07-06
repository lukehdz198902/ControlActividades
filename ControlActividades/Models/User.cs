using System;

namespace ControlActividades.Models
{
    public class User
    {
        public int Id { get; set; }
        public string Username { get; set; }
        public string PasswordHash { get; set; }
        public string Role { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class AdminDashboardItem
    {
        public int UserId { get; set; }
        public string Username { get; set; }
        public int ProjectId { get; set; }
        public string ProjectName { get; set; }
        public double TotalHours { get; set; }
        public int ActivityCount { get; set; }
    }
}
