import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CheckSquare, Users, Bell, BarChart3, Calendar as CalendarIcon, Cpu, ChevronLeft, ChevronRight } from "lucide-react";

// REPLACE these with your actual Render URLs
const USER_SERVICE_URL = "https://user-service-90a5.onrender.com";
const TASK_SERVICE_URL = "https://task-service-x225.onrender.com";
const NOTIFICATION_SERVICE_URL = "https://notification-service-9qcx.onrender.com";

export default function Dashboard() {
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());

  const storedUser = localStorage.getItem("currentUser");
  const profile = storedUser ? JSON.parse(storedUser) : { _id: "unassigned", name: "Operator" };

  useEffect(() => {
    if (!profile._id) return;

    Promise.all([
      fetch(`${USER_SERVICE_URL}/users`).then(res => res.json()).catch(() => []),
      fetch(`${TASK_SERVICE_URL}/tasks?userId=${profile._id}`).then(res => res.json()).catch(() => []),
      fetch(`${NOTIFICATION_SERVICE_URL}/notifications?userId=${profile._id}`).then(res => res.json()).catch(() => [])
    ]).then(([userData, taskData, notificationData]) => {
      setUsers(userData);
      setTasks(taskData);
      setNotifications(notificationData);
    });
  }, [profile._id]);

  // Helper logic for Charts and Calendar
  const getMonthlyTaskCount = (monthIndex) => {
    return tasks.filter(task => {
      if (!task.createdAt) return false;
      return new Date(task.createdAt).getMonth() === monthIndex;
    }).length;
  };

  const monthsData = [
    { label: "Jan", done: getMonthlyTaskCount(0) },
    { label: "Feb", done: getMonthlyTaskCount(1) },
    { label: "Mar", done: getMonthlyTaskCount(2) },
    { label: "Apr", done: getMonthlyTaskCount(3) },
    { label: "May", done: getMonthlyTaskCount(4) },
    { label: "Jun", done: getMonthlyTaskCount(5) },
  ];

  const maxLoadVal = Math.max(...monthsData.map(m => m.done), 1);
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayIndex = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const getTasksForDate = (dayNum) => {
    const d = new Date(currentDate.getFullYear(), currentDate.getMonth(), dayNum);
    const dateString = d.toISOString().split('T')[0];
    return tasks.filter(t => t.dueDate === dateString);
  };

  return (
    <div className="p-6 lg:p-10 min-h-screen bg-[#fff7fb] space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-linear-to-r from-pink-400 to-rose-400 p-8 rounded-3xl text-white shadow-xl">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome Back, {profile.name}!</h1>
          <p className="text-pink-100 text-sm mt-1">Real-time status updates of scheduled actions across your tracking grid.</p>
        </div>
        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/20 text-xs font-semibold">
          <Cpu size={14} className="text-green-300 animate-pulse"/> Workspace Profile Loaded
        </div>
      </div>
      
      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-pink-100 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">My Tasks</p>
            <p className="text-4xl font-extrabold text-gray-800 mt-1">{tasks.length}</p>
          </div>
          <div className="p-4 rounded-2xl bg-pink-50 text-pink-500"><CheckSquare size={26} /></div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-pink-100 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Active Users</p>
            <p className="text-4xl font-extrabold text-gray-800 mt-1">{users.length > 0 ? users.length : 1}</p>
          </div>
          <div className="p-4 rounded-2xl bg-blue-50 text-blue-500"><Users size={26} /></div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-pink-100 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Notifications</p>
            <p className="text-4xl font-extrabold text-gray-800 mt-1">{notifications.length}</p>
          </div>
          <div className="p-4 rounded-2xl bg-amber-50 text-amber-500"><Bell size={26} /></div>
        </div>
      </div>

      {/* GRAPHICAL ANALYSIS AND CALENDAR SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Task Analysis Chart */}
        <div className="bg-white p-8 rounded-3xl border border-pink-100 shadow-xs">
          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <BarChart3 className="text-pink-500" /> Task Activity
          </h2>
          <div className="flex items-end gap-2 h-48 mt-4 border-b border-gray-100">
            {monthsData.map((m, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <motion.div 
                  initial={{ height: 0 }}
                  animate={{ height: `${(m.done / maxLoadVal) * 100}%` }}
                  className="w-full bg-pink-400 rounded-t-md hover:bg-pink-600 transition-colors"
                />
                <span className="text-[10px] font-bold text-gray-400 uppercase">{m.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Calendar Widget */}
        <div className="bg-white p-8 rounded-3xl border border-pink-100 shadow-xs">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <CalendarIcon className="text-pink-500" /> {monthNames[currentDate.getMonth()]}
            </h2>
            <div className="flex gap-1">
              <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))} className="p-2 hover:bg-gray-100 rounded-full"><ChevronLeft size={16}/></button>
              <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))} className="p-2 hover:bg-gray-100 rounded-full"><ChevronRight size={16}/></button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {["S","M","T","W","T","F","S"].map(d => <div key={d} className="text-center text-[10px] font-bold text-gray-300">{d}</div>)}
            {[...Array(firstDayIndex).keys()].map(i => <div key={`empty-${i}`} />)}
            {[...Array(daysInMonth).keys()].map(i => {
              const day = i + 1;
              const hasTasks = getTasksForDate(day).length > 0;
              return (
                <div key={i} className={`relative text-center py-2 text-sm rounded-xl ${hasTasks ? 'bg-pink-50 font-bold text-pink-600' : 'text-gray-600'}`}>
                  {day}
                  {hasTasks && <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-pink-500 rounded-full" />}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}