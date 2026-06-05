import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Clock, Terminal, Activity as ActivityIcon } from "lucide-react";

// REPLACE this URL with your actual Notification Service Render URL
const NOTIFICATION_SERVICE_URL = "https://notification-service-9qcx.onrender.com";

export default function Activity() {
  const [notifications, setNotifications] = useState([]);

  const storedUser = localStorage.getItem("currentUser");
  const profile = storedUser ? JSON.parse(storedUser) : { _id: "unassigned" };

  useEffect(() => {
    if (!profile._id) return;

    fetch(`${NOTIFICATION_SERVICE_URL}/notifications?userId=${profile._id}`)
      .then((res) => res.json())
      .then((data) => setNotifications(data))
      .catch((err) => console.error("Error fetching personalized logs:", err));
  }, [profile._id]);

  return (
    <div className="min-h-screen p-6 lg:p-10 space-y-8 bg-[#fff7fb] text-gray-800 transition-colors duration-300">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 max-w-4xl">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-3">
            <ActivityIcon className="text-pink-500 w-8 h-8" /> System Activity Ledger
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Showing real-time background message events handled exclusively for your workspace session.
          </p>
        </div>
      </div>

      <div className="rounded-3xl border p-6 shadow-xs max-w-4xl bg-white border-pink-100">
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {notifications.length === 0 ? (
              <div className="text-center py-12 text-sm font-medium text-gray-400">
                <Bell size={40} className="mx-auto mb-3 opacity-30 text-pink-400" />
                No system broker notifications recorded for this user profile yet.
              </div>
            ) : (
              notifications.map((log) => (
                <motion.div
                  key={log._id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex items-start gap-4 p-4 rounded-2xl border transition-all bg-[#fff7fb] border-pink-50 hover:border-pink-200"
                >
                  <div className="p-2.5 rounded-xl mt-0.5 bg-pink-100 text-pink-500">
                    <Terminal size={16} />
                  </div>

                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-semibold text-gray-700">
                      {log.message || "Broker Event Processed"}
                    </p>

                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Clock size={12} />
                      <span>
                        {log.createdAt
                          ? new Date(log.createdAt).toLocaleString()
                          : "Just now"}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}