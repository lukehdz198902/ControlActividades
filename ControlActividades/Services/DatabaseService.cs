using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;
using ControlActividades.Models;

namespace ControlActividades.Services
{
    public class DatabaseService
    {
        private readonly string _connectionString;

        public DatabaseService()
        {
            _connectionString = ConfigurationManager.ConnectionStrings["DefaultConnection"].ConnectionString;
        }

        public User ValidateUser(string username)
        {
            using (var conn = new SqlConnection(_connectionString))
            using (var cmd = new SqlCommand("usp_ValidateUser", conn))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@Username", username);

                conn.Open();
                using (var reader = cmd.ExecuteReader())
                {
                    if (reader.Read())
                    {
                        return new User
                        {
                            Id = (int)reader["Id"],
                            Username = (string)reader["Username"],
                            PasswordHash = (string)reader["PasswordHash"],
                            Role = reader["Role"] != DBNull.Value ? (string)reader["Role"] : "user",
                            CreatedAt = (DateTime)reader["CreatedAt"]
                        };
                    }
                }
            }
            return null;
        }

        public List<Project> GetProjectsByUser(int userId)
        {
            var projects = new List<Project>();
            using (var conn = new SqlConnection(_connectionString))
            using (var cmd = new SqlCommand("usp_GetProjectsByUser", conn))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@UserId", userId);

                conn.Open();
                using (var reader = cmd.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        projects.Add(new Project
                        {
                            Id = (int)reader["Id"],
                            Name = (string)reader["Name"],
                            UserId = (int)reader["UserId"],
                            CreatedAt = (DateTime)reader["CreatedAt"]
                        });
                    }
                }
            }
            return projects;
        }

        public Project GetProjectById(int projectId, int userId)
        {
            using (var conn = new SqlConnection(_connectionString))
            using (var cmd = new SqlCommand("usp_GetProjectById", conn))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@ProjectId", projectId);
                cmd.Parameters.AddWithValue("@UserId", userId);

                conn.Open();
                using (var reader = cmd.ExecuteReader())
                {
                    if (reader.Read())
                    {
                        return new Project
                        {
                            Id = (int)reader["Id"],
                            Name = (string)reader["Name"],
                            UserId = (int)reader["UserId"],
                            CreatedAt = (DateTime)reader["CreatedAt"]
                        };
                    }
                }
            }
            return null;
        }

        public Project CreateProject(string name, int userId)
        {
            using (var conn = new SqlConnection(_connectionString))
            using (var cmd = new SqlCommand("usp_CreateProject", conn))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@Name", name);
                cmd.Parameters.AddWithValue("@UserId", userId);

                conn.Open();
                using (var reader = cmd.ExecuteReader())
                {
                    if (reader.Read())
                    {
                        var success = (bool)reader["Success"];
                        if (!success)
                            return null;

                        return new Project
                        {
                            Id = (int)reader["Id"],
                            Name = (string)reader["Name"],
                            UserId = (int)reader["UserId"],
                            CreatedAt = (DateTime)reader["CreatedAt"]
                        };
                    }
                }
            }
            return null;
        }

        public List<Activity> GetActivitiesByProject(int projectId, int userId)
        {
            var activities = new List<Activity>();
            using (var conn = new SqlConnection(_connectionString))
            using (var cmd = new SqlCommand("usp_GetActivitiesByProject", conn))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@ProjectId", projectId);
                cmd.Parameters.AddWithValue("@UserId", userId);

                conn.Open();
                using (var reader = cmd.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        activities.Add(MapActivity(reader));
                    }
                }
            }
            return activities;
        }

        public Activity CreateActivity(Activity activity)
        {
            using (var conn = new SqlConnection(_connectionString))
            using (var cmd = new SqlCommand("usp_CreateActivity", conn))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@ProjectId", activity.ProjectId);
                cmd.Parameters.AddWithValue("@UserId", activity.UserId);
                cmd.Parameters.AddWithValue("@Date", activity.Date);
                cmd.Parameters.AddWithValue("@Description", activity.Description);
                cmd.Parameters.AddWithValue("@Hours", activity.Hours);
                cmd.Parameters.AddWithValue("@Minutes", activity.Minutes);
                cmd.Parameters.AddWithValue("@Icon", activity.Icon ?? "💻");
                cmd.Parameters.AddWithValue("@Importance", activity.Importance ?? "Media");

                conn.Open();
                using (var reader = cmd.ExecuteReader())
                {
                    if (reader.Read())
                    {
                        return MapActivity(reader);
                    }
                }
            }
            return null;
        }

        public List<Project> GetDashboardSummary(int userId, int month, int year)
        {
            var projects = new List<Project>();
            using (var conn = new SqlConnection(_connectionString))
            using (var cmd = new SqlCommand("usp_GetDashboardSummary", conn))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@UserId", userId);
                cmd.Parameters.AddWithValue("@Month", month);
                cmd.Parameters.AddWithValue("@Year", year);

                conn.Open();
                using (var reader = cmd.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        projects.Add(new Project
                        {
                            Id = (int)reader["Id"],
                            Name = (string)reader["Name"],
                            UserId = (int)reader["UserId"],
                            CreatedAt = (DateTime)reader["CreatedAt"],
                            MonthHours = reader["MonthHours"] != DBNull.Value ? Math.Round(Convert.ToDouble(reader["MonthHours"]), 2) : 0,
                            TotalHours = reader["TotalHours"] != DBNull.Value ? Math.Round(Convert.ToDouble(reader["TotalHours"]), 2) : 0,
                            ActivityCount = reader["ActivityCount"] != DBNull.Value ? Convert.ToInt32(reader["ActivityCount"]) : 0
                        });
                    }
                }
            }
            return projects;
        }

        public List<Activity> GetReportData(int projectId, int userId, int month, int year)
        {
            var activities = new List<Activity>();
            using (var conn = new SqlConnection(_connectionString))
            using (var cmd = new SqlCommand("usp_GetReportData", conn))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@ProjectId", projectId);
                cmd.Parameters.AddWithValue("@UserId", userId);
                cmd.Parameters.AddWithValue("@Month", month);
                cmd.Parameters.AddWithValue("@Year", year);

                conn.Open();
                using (var reader = cmd.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        activities.Add(MapActivity(reader));
                    }
                }
            }
            return activities;
        }

        public List<User> GetAllUsers()
        {
            var users = new List<User>();
            using (var conn = new SqlConnection(_connectionString))
            using (var cmd = new SqlCommand("usp_GetAllUsers", conn))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                conn.Open();
                using (var reader = cmd.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        users.Add(new User
                        {
                            Id = (int)reader["Id"],
                            Username = (string)reader["Username"],
                            Role = reader["Role"] != DBNull.Value ? (string)reader["Role"] : "user",
                            CreatedAt = (DateTime)reader["CreatedAt"]
                        });
                    }
                }
            }
            return users;
        }

        public User CreateUser(string username, string passwordHash, string role)
        {
            using (var conn = new SqlConnection(_connectionString))
            using (var cmd = new SqlCommand("usp_CreateUser", conn))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@Username", username);
                cmd.Parameters.AddWithValue("@PasswordHash", passwordHash);
                cmd.Parameters.AddWithValue("@Role", role);

                conn.Open();
                using (var reader = cmd.ExecuteReader())
                {
                    if (reader.Read())
                    {
                        var success = (bool)reader["Success"];
                        if (!success) return null;

                        return new User
                        {
                            Id = (int)reader["Id"],
                            Username = (string)reader["Username"],
                            Role = (string)reader["Role"],
                            CreatedAt = (DateTime)reader["CreatedAt"]
                        };
                    }
                }
            }
            return null;
        }

        public bool UpdateUserPassword(int userId, string newPasswordHash)
        {
            using (var conn = new SqlConnection(_connectionString))
            using (var cmd = new SqlCommand("usp_UpdateUserPassword", conn))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@UserId", userId);
                cmd.Parameters.AddWithValue("@NewPasswordHash", newPasswordHash);

                conn.Open();
                var rows = (int)cmd.ExecuteScalar();
                return rows > 0;
            }
        }

        public List<AdminDashboardItem> GetAdminDashboard(int month, int year)
        {
            var items = new List<AdminDashboardItem>();
            using (var conn = new SqlConnection(_connectionString))
            using (var cmd = new SqlCommand("usp_GetAdminDashboard", conn))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@Month", month);
                cmd.Parameters.AddWithValue("@Year", year);

                conn.Open();
                using (var reader = cmd.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        items.Add(new AdminDashboardItem
                        {
                            UserId = (int)reader["UserId"],
                            Username = (string)reader["Username"],
                            ProjectId = (int)reader["ProjectId"],
                            ProjectName = (string)reader["ProjectName"],
                            TotalHours = Math.Round(Convert.ToDouble(reader["TotalHours"]), 2),
                            ActivityCount = (int)reader["ActivityCount"]
                        });
                    }
                }
            }
            return items;
        }

        public User UpdateUser(int userId, string newUsername, string newRole)
        {
            using (var conn = new SqlConnection(_connectionString))
            using (var cmd = new SqlCommand("usp_UpdateUser", conn))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@UserId", userId);
                cmd.Parameters.AddWithValue("@NewUsername", newUsername);
                cmd.Parameters.AddWithValue("@NewRole", newRole);

                conn.Open();
                using (var reader = cmd.ExecuteReader())
                {
                    if (reader.Read())
                    {
                        var hasSuccess = false;
                        for (int i = 0; i < reader.FieldCount; i++)
                        {
                            if (reader.GetName(i) == "Success")
                            {
                                hasSuccess = true;
                                var success = (bool)reader["Success"];
                                if (!success) return null;
                                break;
                            }
                        }
                        if (!hasSuccess)
                        {
                            return new User
                            {
                                Id = (int)reader["Id"],
                                Username = (string)reader["Username"],
                                Role = (string)reader["Role"],
                                CreatedAt = (DateTime)reader["CreatedAt"]
                            };
                        }
                    }
                }
            }
            return null;
        }

        public Activity MapActivityFull(SqlDataReader reader)
        {
            var a = MapActivity(reader);
            for (int i = 0; i < reader.FieldCount; i++)
            {
                if (reader.GetName(i) == "ProjectName")
                    a.ProjectName = (string)reader["ProjectName"];
            }
            return a;
        }

        public List<Activity> GetUserActivities(int userId, int month, int year)
        {
            var activities = new List<Activity>();
            using (var conn = new SqlConnection(_connectionString))
            using (var cmd = new SqlCommand("usp_GetUserActivities", conn))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@UserId", userId);
                cmd.Parameters.AddWithValue("@Month", month);
                cmd.Parameters.AddWithValue("@Year", year);

                conn.Open();
                using (var reader = cmd.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        activities.Add(MapActivityFull(reader));
                    }
                }
            }
            return activities;
        }

        private Activity MapActivity(SqlDataReader reader)
        {
            return new Activity
            {
                Id = (int)reader["Id"],
                ProjectId = (int)reader["ProjectId"],
                UserId = (int)reader["UserId"],
                Date = (DateTime)reader["Date"],
                Description = (string)reader["Description"],
                Hours = (int)reader["Hours"],
                Minutes = (int)reader["Minutes"],
                Icon = (string)reader["Icon"],
                Importance = (string)reader["Importance"],
                CreatedAt = (DateTime)reader["CreatedAt"],
                Username = reader["Username"] != DBNull.Value ? (string)reader["Username"] : ""
            };
        }
    }
}
