import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CheckSquare, Users, Bell, BarChart3, Calendar as CalendarIcon, Cpu, ChevronLeft, ChevronRight } from "lucide-react";

export default function Dashboard() {
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [notifications, setNotifications] = useState([]); // Changed logs to notifications
  const [currentDate, setCurrentDate] = useState(new Date());

  const storedUser = localStorage.getItem("currentUser");
  const profile = storedUser ? JSON.parse(storedUser) : { _id: "unassigned", name: "Operator" };

  useEffect(() => {
    if (!profile._id) return;

    Promise.all([
      fetch("http://localhost:3001/users").then(res => res.json()).catch(() => []),
      // Filtered Tasks for the active user
      fetch(`http://localhost:3002/tasks?userId=${profile._id}`).then(res => res.json()).catch(() => []),
      // Filtered Notifications for the active user
      fetch(`http://localhost:3003/notifications?userId=${profile._id}`).then(res => res.json()).catch(() => [])
    ]).then(([userData, taskData, notificationData]) => {
      setUsers(userData);
      setTasks(taskData);
      setNotifications(notificationData);
    });
  }, [profile._id]);

  // Group task numbers by creation month dynamically
  const getMonthlyTaskCount = (monthIndex) => {
    return tasks.filter(task => {
      if (!task.createdAt) return false;
      const taskMonth = new Date(task.createdAt).getMonth();
      return taskMonth === monthIndex;
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

  // Calendar Calculation Helpers
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayIndex = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const getTasksForDate = (dayNum) => {
    const formattedDay = dayNum < 10 ? `0${dayNum}` : dayNum;
    const formattedMonth = (currentDate.getMonth() + 1) < 10 ? `0${currentDate.getMonth() + 1}` : currentDate.getMonth() + 1;
    const targetString = `${currentDate.getFullYear()}-${formattedMonth}-${formattedDay}`;
    return tasks.filter(t => t.dueDate === targetString);
  };

  return (
    <div className="p-6 lg:p-10 min-h-screen bg-[#fff7fb] space-y-8">
      
      {/* MONITOR CONTROL STATUS BAR */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-linear-to-r from-pink-400 to-rose-400 p-8 rounded-3xl text-white shadow-xl">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome Back, {profile.name}!</h1>
          <p className="text-pink-100 text-sm mt-1">Real-time status updates of scheduled actions across your tracking grid.</p>
        </div>
        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/20 text-xs font-semibold">
          <Cpu size={14} className="text-green-300 animate-pulse"/> Workspace Profile Loaded
        </div>
      </div>

      {/* METRIC KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1: Active Assignments */}
        <div className="bg-white p-6 rounded-3xl border border-pink-100 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">My Tasks</p>
            <p className="text-4xl font-extrabold text-gray-800 mt-1">{tasks.length}</p>
          </div>
          <div className="p-4 rounded-2xl bg-pink-50 text-pink-500"><CheckSquare size={26} /></div>
        </div>

        {/* Card 2: No of Users instead of operational team */}
        <div className="bg-white p-6 rounded-3xl border border-pink-100 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Active Users</p>
            <p className="text-4xl font-extrabold text-gray-800 mt-1">
              {users.length > 0 ? users.length : 1} {/* Falls back gracefully if service is local */}
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-blue-50 text-blue-500"><Users size={26} /></div>
        </div>

        {/* Card 3: Notification number instead of broker events */}
        <div className="bg-white p-6 rounded-3xl border border-pink-100 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Notifications</p>
            <p className="text-4xl font-extrabold text-gray-800 mt-1">{notifications.length}</p>
          </div>
          <div className="p-4 rounded-2xl bg-amber-50 text-amber-500"><Bell size={26} /></div>
        </div>
      </div>

      {/* CHARTS & CALENDAR GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* GRAPH COLUMN */}
        <div className="lg:col-span-2 bg-white p-6 lg:p-8 rounded-3xl border border-pink-100 shadow-xs flex flex-col justify-between space-y-6">
          <div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <BarChart3 size={20} className="text-pink-500" /> Task Operational Velocity
            </h2>
            <p className="text-gray-400 text-xs mt-0.5">Real-time breakdown monitoring metric of tasks allocated across active calendar months</p>
          </div>

          <div className="h-52 flex items-end justify-between gap-4 pt-6 border-b border-gray-100 px-4">
            {monthsData.map((month) => (
              <div key={month.label} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                <span className="opacity-0 group-hover:opacity-100 bg-gray-800 text-white text-[10px] px-2 py-0.5 rounded-md mb-1 absolute transition-opacity transform -translate-y-12">
                  {month.done} tasks
                </span>
                <motion.div 
                  initial={{ height: 0 }}
                  animate={{ height: `${(month.done / maxLoadVal) * 100}%` }}
                  className="w-full bg-gradient-to-t from-pink-400 to-rose-400 rounded-t-xl group-hover:from-pink-500 group-hover:to-rose-500 transition-all min-h-[6px]"
                />
                <span className="text-xs font-bold text-gray-400 mt-2">{month.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* WORK LEDGER CALENDAR */}
        <div className="bg-white p-6 rounded-3xl border border-pink-100 shadow-xs space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-gray-800 flex items-center gap-2 text-md">
              <CalendarIcon size={18} className="text-pink-400" /> Deadline Allocation
            </h3>
            <div className="flex gap-1">
              <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="p-1.5 hover:bg-pink-50 text-gray-400 rounded-lg cursor-pointer"><ChevronLeft size={16} /></button>
              <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="p-1.5 hover:bg-pink-50 text-gray-400 rounded-lg cursor-pointer"><ChevronRight size={16} /></button>
            </div>
          </div>

          <div className="text-center text-sm font-bold text-gray-700 bg-pink-50/50 py-2 rounded-xl">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </div>

          <div className="grid grid-cols-7 text-center text-[11px] font-bold text-gray-400 border-b border-gray-50 pb-2">
            <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
          </div>
          
          <div className="grid grid-cols-7 gap-y-2 text-center text-xs font-semibold text-gray-700">
            {Array.from({ length: firstDayIndex }).map((_, i) => <span key={`empty-${i}`} />)}
            
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const scheduledTasks = getTasksForDate(day);
              const hasTaskScheduled = scheduledTasks.length > 0;

              return (
                <div key={day} className="flex flex-col items-center justify-center relative group py-1">
                  <span className={`h-8 w-8 flex items-center justify-center rounded-full transition-all ${
                    hasTaskScheduled 
                      ? "bg-pink-500 text-white font-bold shadow-md shadow-pink-100" 
                      : "hover:bg-pink-50 text-gray-600"
                  }`}>
                    {day}
                  </span>
                  
                  {hasTaskScheduled && (
                    <div className="absolute hidden group-hover:block bottom-10 bg-gray-900 text-white text-[10px] p-2 rounded-lg w-32 z-50 shadow-xl border border-gray-700">
                      <p className="font-bold border-b border-gray-700 pb-1 mb-1">Tasks Due ({scheduledTasks.length}):</p>
                      {scheduledTasks.map(t => (
                        <p key={t._id} className="truncate">• {t.title}</p>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
}