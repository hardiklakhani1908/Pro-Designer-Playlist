import React, { useState } from 'react';
import { useData, Module } from '../../context/DataContext';
import { Pencil, X } from 'lucide-react';

export const AdminModules = () => {
  const { modules, updateModule, topics } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form State
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('');
  
  const openEditModal = (module: Module) => {
    setName(module.name);
    setEmoji(module.emoji);
    setEditingId(module.id);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !emoji || !editingId) return;

    updateModule(editingId, {
      name,
      emoji
    });
    
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white">Modules</h2>
          <p className="text-sm text-[#8a8f98]">Manage the 5 main categories.</p>
        </div>
      </div>

      <div className="bg-[#0A0A0A] border border-[#1f1f1f] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#111] text-[#8a8f98] font-medium border-b border-[#1f1f1f]">
              <tr>
                <th className="px-4 py-3">Icon</th>
                <th className="px-4 py-3">Module Name</th>
                <th className="px-4 py-3 text-right">Topics Count</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f1f1f]">
              {modules.map(module => (
                <tr key={module.id} className="hover:bg-[#111] transition-colors">
                  <td className="px-4 py-3 text-2xl">
                    {module.emoji}
                  </td>
                  <td className="px-4 py-3 font-medium text-white">
                    {module.name}
                  </td>
                  <td className="px-4 py-3 text-[#8a8f98] text-right">
                    <span className="inline-block px-2.5 py-1 bg-[#1a1a1a] rounded text-xs">
                      {topics.filter(t => t.module_id === module.id).length}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end">
                      <button 
                        onClick={() => openEditModal(module)}
                        className="p-1.5 text-[#8a8f98] hover:text-white bg-[#1a1a1a] rounded hover:bg-[#333] transition-colors"
                        title="Edit Module"
                      >
                        <Pencil size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0A0A0A] border border-[#1f1f1f] rounded-xl w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-[#1f1f1f]">
              <h3 className="font-semibold text-white">Edit Module</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-[#8a8f98] hover:text-white">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#8a8f98] mb-1">Module Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#111] border border-[#333] rounded-md text-white text-sm focus:outline-none focus:border-gray-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#8a8f98] mb-1">Emoji / Icon</label>
                <input 
                  type="text" 
                  value={emoji}
                  onChange={e => setEmoji(e.target.value)}
                  className="w-full px-3 py-2 bg-[#111] border border-[#333] rounded-md text-white text-sm focus:outline-none focus:border-gray-500 text-2xl"
                  required
                  maxLength={5}
                />
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
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
