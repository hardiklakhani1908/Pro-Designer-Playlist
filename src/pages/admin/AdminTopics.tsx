import React, { useState } from 'react';
import { useData, Topic } from '../../context/DataContext';
import { Plus, Pencil, Trash2, X } from 'lucide-react';

export const AdminTopics = () => {
  const { topics, modules, addTopic, updateTopic, deleteTopic } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form State
  const [name, setName] = useState('');
  const [moduleId, setModuleId] = useState(modules[0]?.id || '');
  
  const resetForm = () => {
    setName('');
    setModuleId(modules[0]?.id || '');
    setEditingId(null);
  };

  const openAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (topic: Topic) => {
    setName(topic.name);
    setModuleId(topic.module_id);
    setEditingId(topic.id);
    setIsModalOpen(true);
  };

  const generateSlug = (str: string) => {
    return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !moduleId) return;

    const moduleObj = modules.find(m => m.id === moduleId);
    if (!moduleObj) return;

    if (editingId) {
      updateTopic(editingId, {
        name,
        module_id: moduleId,
        module_name: moduleObj.name,
        slug: generateSlug(name)
      });
    } else {
      addTopic({
        name,
        slug: generateSlug(name),
        module_id: moduleId,
        module_name: moduleObj.name,
        video_count: 0
      });
    }
    
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this topic? All associated videos will also be deleted.")) {
      deleteTopic(id);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white">Topics</h2>
          <p className="text-sm text-[#8a8f98]">Manage subcategories for your modules.</p>
        </div>
        <button 
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-white text-black font-semibold text-sm rounded-md hover:bg-gray-200 transition-colors"
        >
          <Plus size={16} /> Add New Topic
        </button>
      </div>

      <div className="bg-[#0A0A0A] border border-[#1f1f1f] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#111] text-[#8a8f98] font-medium border-b border-[#1f1f1f]">
              <tr>
                <th className="px-4 py-3">Topic Name</th>
                <th className="px-4 py-3">Module</th>
                <th className="px-4 py-3 text-right">Videos Count</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f1f1f]">
              {topics.map(topic => (
                <tr key={topic.id} className="hover:bg-[#111] transition-colors">
                  <td className="px-4 py-3 font-medium text-white">
                    {topic.name}
                  </td>
                  <td className="px-4 py-3 text-[#8a8f98]">{topic.module_name}</td>
                  <td className="px-4 py-3 text-[#8a8f98] text-right">
                    <span className="inline-block px-2.5 py-1 bg-[#1a1a1a] rounded text-xs">
                      {topic.video_count}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => openEditModal(topic)}
                        className="p-1.5 text-[#8a8f98] hover:text-white bg-[#1a1a1a] rounded hover:bg-[#333] transition-colors"
                      >
                        <Pencil size={14} />
                      </button>
                      <button 
                        onClick={() => handleDelete(topic.id)}
                        className="p-1.5 text-red-500/70 hover:text-red-500 bg-red-500/10 rounded hover:bg-red-500/20 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {topics.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-[#8a8f98]">
                    No topics found. Click "Add New Topic" to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0A0A0A] border border-[#1f1f1f] rounded-xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-[#1f1f1f]">
              <h3 className="font-semibold text-white">{editingId ? 'Edit Topic' : 'Add New Topic'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-[#8a8f98] hover:text-white">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#8a8f98] mb-1">Topic Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#111] border border-[#333] rounded-md text-white text-sm focus:outline-none focus:border-gray-500"
                  placeholder="e.g. Design Systems"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#8a8f98] mb-1">Parent Module</label>
                <select 
                  value={moduleId}
                  onChange={e => setModuleId(e.target.value)}
                  className="w-full px-3 py-2 bg-[#111] border border-[#333] rounded-md text-white text-sm focus:outline-none focus:border-gray-500"
                  required
                >
                  {modules.map(mod => (
                    <option key={mod.id} value={mod.id}>{mod.name}</option>
                  ))}
                </select>
              </div>

              <div className="pt-4 border-t border-[#1f1f1f] flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-[#8a8f98] hover:text-white"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-white text-black text-sm font-semibold rounded-md hover:bg-gray-200"
                >
                  {editingId ? 'Save Changes' : 'Save Topic'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
