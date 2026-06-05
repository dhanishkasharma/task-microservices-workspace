import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, CheckSquare, Calendar, User as UserIcon, Edit3 } from "lucide-react";

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);

  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDate, setEditDate] = useState("");

  const storedUser = localStorage.getItem("currentUser");
  const profile = storedUser ? JSON.parse(storedUser) : { _id: "unassigned", name: "System Operator" };

  useEffect(() => {
    if (!profile._id) return;
    fetch(`http://localhost:3002/tasks?userId=${profile._id}`)
      .then((res) => res.json())
      .then((data) => setTasks(data))
      .catch((err) => console.error("Error loading tasks:", err));
  }, [profile._id]);

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newTaskPayload = {
      title,
      description,
      userId: profile._id,
      dueDate: dueDate
    };

    fetch("http://localhost:3002/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newTaskPayload)
    })
      .then((res) => res.json())
      .then((savedTask) => {
        setTasks((prev) => [...prev, savedTask]);
        // Direct HTTP postNotification trace completely removed. 
        // Task Service automatically fires the event straight into the RabbitMQ pipeline!
        setTitle("");
        setDescription("");
      })
      .catch((err) => console.error("Error adding task:", err));
  };

  const startEditing = (task) => {
    setEditingId(task._id);
    setEditTitle(task.title);
    setEditDescription(task.description);
    setEditDate(task.dueDate || new Date().toISOString().split('T')[0]);
  };

  const handleUpdateTask = (id) => {
    fetch(`http://localhost:3002/tasks/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: editTitle, description: editDescription, userId: profile._id, dueDate: editDate })
    })
      .then((res) => res.json())
      .then((updatedTask) => {
        setTasks((prev) => prev.map((t) => (t._id === id ? updatedTask : t)));
        setEditingId(null);
      })
      .catch((err) => console.error("Error updating task:", err));
  };

  // Treated as "Task Finished"
  const handleFinishTask = (id) => {
    fetch(`http://localhost:3002/tasks/${id}`, { method: "DELETE" })
      .then(() => {
        setTasks((prev) => prev.filter((task) => task._id !== id));
        // Direct HTTP fetch removed here as well. 
        // The Backend Task Service broadcasts the 'finished' state directly to the RabbitMQ consumer.
      })
      .catch((err) => console.error("Error deleting task:", err));
  };

  return (
    <div className="min-h-screen bg-[#fff7fb] p-6 lg:p-10">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* WORKSPACE CREATION FORM */}
        <div className="bg-white p-8 rounded-3xl border border-pink-100 shadow-sm h-fit space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Workspace</h2>
            <p className="text-xs text-pink-500 font-semibold mt-1">Logged in as: {profile.name}</p>
          </div>

          <form onSubmit={handleAddTask} className="space-y-5">
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Task Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What needs to be done?"
                className="w-full mt-2 p-4 bg-[#fff7fb] border border-pink-50 rounded-2xl outline-none focus:border-pink-300 text-sm text-gray-700"
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide task details..."
                className="w-full mt-2 p-4 bg-[#fff7fb] border border-pink-50 rounded-2xl outline-none focus:border-pink-300 text-sm h-28 resize-none text-gray-700"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Schedule Target Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full mt-2 p-4 bg-[#fff7fb] border border-pink-50 rounded-2xl outline-none focus:border-pink-300 text-sm text-gray-600 cursor-pointer"
              />
            </div>

            <button type="submit" className="w-full bg-gradient-to-r from-pink-400 to-rose-400 text-white p-4 rounded-2xl font-semibold flex items-center justify-center gap-2 shadow-lg cursor-pointer">
              <Plus size={18} /> Deploy Task
            </button>
          </form>
        </div>

        {/* PIPELINE STREAM LISTING */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-3xl font-bold text-gray-800">Active Pipeline</h2>
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {tasks.map((task) => (
                <motion.div key={task._id} layout className="bg-white p-6 rounded-3xl border border-pink-100 flex flex-col md:flex-row justify-between gap-6">
                  {editingId === task._id ? (
                    <div className="flex-1 space-y-3 w-full">
                      <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full p-3 bg-[#fff7fb] border border-pink-200 rounded-xl font-semibold" />
                      <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} className="w-full p-3 bg-[#fff7fb] border border-pink-200 rounded-xl h-20 resize-none" />
                      <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} className="p-3 bg-[#fff7fb] border border-pink-200 rounded-xl text-xs" />
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => setEditingId(null)} className="px-3 py-2 text-xs bg-gray-100 rounded-xl">Cancel</button>
                        <button onClick={() => handleUpdateTask(task._id)} className="px-3 py-2 text-xs bg-pink-500 text-white rounded-xl">Save</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1 space-y-2">
                        <h3 className="font-bold text-gray-800 text-xl">{task.title}</h3>
                        <p className="text-gray-500 text-sm">{task.description}</p>
                        <div className="flex gap-4 pt-2 text-xs text-gray-400 font-semibold">
                          <span className="bg-[#fff7fb] px-3 py-1 rounded-lg text-pink-500 border border-pink-50">
                            <UserIcon size={13} className="inline mr-1" /> Creator: {profile.name}
                          </span>
                          <span className="flex items-center gap-1.5 py-1">
                            <Calendar size={13}/> Due: {task.dueDate || "Not Set"}
                          </span>
                        </div>
                      </div>
                      
                      {/* Checkmark Button explicitly marked as "Complete/Finish Task" */}
                      <div className="flex gap-2 items-center">
                        <button onClick={() => startEditing(task)} className="p-3 bg-gray-50 text-gray-400 hover:text-pink-500 rounded-2xl cursor-pointer" title="Edit Details"><Edit3 size={18} /></button>
                        <button 
                          onClick={() => handleFinishTask(task._id)} 
                          className="p-3 bg-emerald-50 text-emerald-500 hover:bg-emerald-500 hover:text-white rounded-2xl cursor-pointer transition-all flex items-center gap-1.5 font-semibold text-xs"
                          title="Mark Finished"
                        >
                          <CheckSquare size={18} />
                          <span>Finish</span>
                        </button>
                      </div>
                    </>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

      </div>
    </div>
  );
}