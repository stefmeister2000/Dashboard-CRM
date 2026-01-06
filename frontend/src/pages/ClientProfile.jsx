import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { clientsAPI, notesAPI, dashboardAPI, businessesAPI } from '../api';

export default function ClientProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [notes, setNotes] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [newNote, setNewNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadClientData();
  }, [id]);

  const loadClientData = async () => {
    setLoading(true);
    try {
      const [clientRes, notesRes, timelineRes, businessesRes] = await Promise.all([
        clientsAPI.getById(id),
        notesAPI.getByClientId(id),
        dashboardAPI.getTimeline(id),
        businessesAPI.getAll()
      ]);
      setClient(clientRes.data);
      setNotes(notesRes.data);
      setTimeline(timelineRes.data);
      setBusinesses(businessesRes.data);
      setEditForm({
        full_name: clientRes.data.full_name,
        email: clientRes.data.email || '',
        phone: clientRes.data.phone || '',
        status: clientRes.data.status,
        tags: clientRes.data.tags || [],
        business_id: clientRes.data.business_id || null
      });
    } catch (error) {
      console.error('Failed to load client data:', error);
      if (error.response?.status === 404) {
        navigate('/clients');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await clientsAPI.update(id, editForm);
      setClient(response.data);
      setEditing(false);
      await loadClientData(); // Reload to get updated timeline
    } catch (error) {
      console.error('Failed to update client:', error);
      alert('Failed to update client');
    } finally {
      setSaving(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    setSaving(true);
    try {
      await notesAPI.create({ client_id: parseInt(id), note_text: newNote });
      setNewNote('');
      await loadClientData();
    } catch (error) {
      console.error('Failed to add note:', error);
      alert('Failed to add note');
    } finally {
      setSaving(false);
    }
  };

  const handleTagChange = (e) => {
    const tagInput = e.target.value;
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const tags = [...(editForm.tags || []), tagInput.trim()];
      setEditForm({ ...editForm, tags: [...new Set(tags)] });
      e.target.value = '';
    }
  };

  const removeTag = (tagToRemove) => {
    setEditForm({
      ...editForm,
      tags: editForm.tags.filter(tag => tag !== tagToRemove)
    });
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-600">Loading client profile...</div>;
  }

  if (!client) {
    return <div className="text-center py-12 text-red-600">Client not found</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <button
          onClick={() => navigate('/clients')}
          className="text-cyan-600 hover:text-cyan-800 mb-4 flex items-center"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Clients
        </button>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{client.full_name}</h1>
            <p className="text-sm text-gray-600 mt-1">Client profile and activity</p>
          </div>
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 font-medium"
            >
              Edit
            </button>
          ) : (
            <div className="space-x-2">
              <button
                onClick={() => {
                  setEditing(false);
                  setEditForm({
                    full_name: client.full_name,
                    email: client.email || '',
                    phone: client.phone || '',
                    status: client.status,
                    tags: client.tags || [],
                    business_id: client.business_id || null
                  });
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 font-medium"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact Info */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
            {editing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={editForm.full_name}
                    onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-white"
                  >
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business
                  </label>
                  <select
                    value={editForm.business_id || ''}
                    onChange={(e) => setEditForm({ ...editForm, business_id: e.target.value ? parseInt(e.target.value) : null })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-white"
                  >
                    <option value="">No Business</option>
                    {businesses.map((business) => (
                      <option key={business.id} value={business.id}>
                        {business.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tags
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {editForm.tags && editForm.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 text-sm bg-purple-100 text-purple-800 rounded flex items-center"
                      >
                        {tag}
                        <button
                          onClick={() => removeTag(tag)}
                          className="ml-2 text-purple-600 hover:text-purple-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder="Add tag (press Enter)"
                    onKeyDown={handleTagChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <span className="text-sm text-gray-600 font-medium">Email:</span>
                  <p className="text-gray-900 mt-1">{client.email || '-'}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600 font-medium">Phone:</span>
                  <p className="text-gray-900 mt-1">{client.phone || '-'}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600 font-medium">Status:</span>
                  <div className="mt-1">
                    <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      client.status === 'active' ? 'bg-green-100 text-green-800' :
                      client.status === 'contacted' ? 'bg-blue-100 text-blue-800' :
                      client.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {client.status}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-sm text-gray-600 font-medium">Source:</span>
                  <p className="text-gray-900 capitalize mt-1">{client.source}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600 font-medium">Business:</span>
                  <p className="text-gray-900 mt-1">{client.business_name || 'No Business'}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600 font-medium">Tags:</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {client.tags && client.tags.length > 0 ? (
                      client.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full"
                        >
                          {tag}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-400 text-sm">No tags</span>
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-sm text-gray-600 font-medium">Signup Date:</span>
                  <p className="text-gray-900 mt-1">{new Date(client.created_at).toLocaleString()}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Notes and Timeline */}
        <div className="lg:col-span-2 space-y-6">
          {/* Notes */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes</h2>
            <div className="mb-4">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add a note..."
                rows="3"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
              <button
                onClick={handleAddNote}
                disabled={!newNote.trim() || saving}
                className="mt-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 font-medium"
              >
                Add Note
              </button>
            </div>
            <div className="space-y-4">
              {notes.length === 0 ? (
                <p className="text-gray-500 text-sm">No notes yet</p>
              ) : (
                notes.map((note) => (
                  <div key={note.id} className="border-l-4 border-cyan-500 pl-4 py-2">
                    <p className="text-gray-900">{note.note_text}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {note.created_by_email} • {new Date(note.created_at).toLocaleString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h2>
            <div className="space-y-4">
              {timeline.length === 0 ? (
                <p className="text-gray-500 text-sm">No events yet</p>
              ) : (
                timeline.map((event) => (
                  <div key={event.id} className="border-l-4 border-gray-300 pl-4 py-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900 capitalize">{event.event_type}</p>
                        {event.payload && Object.keys(event.payload).length > 0 && (
                          <pre className="text-xs text-gray-600 mt-1 bg-gray-50 p-2 rounded">
                            {JSON.stringify(event.payload, null, 2)}
                          </pre>
                        )}
                      </div>
                      <span className="text-xs text-gray-500 whitespace-nowrap ml-4">
                        {new Date(event.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

