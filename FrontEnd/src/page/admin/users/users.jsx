import React, { useState, useEffect } from 'react';
import './users.css';
import AdminSidebar from '../../../components/AdminSidebar/AdminSidebar';

const Users = () => {
  const [activeLink, setActiveLink] = useState('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(10);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // 添加用户状态变量
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    role: 'user'
  });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // 编辑用户状态变量
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  
  // 删除用户状态变量
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  
  // Fetch users from the API
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        
        // Using the complete backend URL to ensure API requests correctly reach the backend server
        // The backend is assumed to run on port 3000, adjust if different
        const backendUrl = 'http://localhost:3000';
        const response = await fetch(`${backendUrl}/api/admin/users`, {
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `Failed to fetch users: ${response.status}`);
        }
        
        const data = await response.json();
        setUsers(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching users:', err);
        setError(err.message);
        // Fallback to sample data if API fails (for development purposes)
        setUsers([
          { id: 1, name: 'John Doe', email: 'john.doe@example.com', role: 'Park Guide', status: 'Active', avatar: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=150', registeredDate: '2023-04-15', certificates: 3 },
          { id: 2, name: 'Jane Smith', email: 'jane.smith@example.com', role: 'Park Guide', status: 'Active', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', registeredDate: '2023-05-22', certificates: 2 },
          { id: 3, name: 'Robert Johnson', email: 'robert.johnson@example.com', role: 'Admin', status: 'Active', avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=150', registeredDate: '2023-01-05', certificates: 0 },
          { id: 4, name: 'Emily Davis', email: 'emily.davis@example.com', role: 'Park Guide', status: 'Inactive', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150', registeredDate: '2023-03-10', certificates: 1 },
          { id: 5, name: 'Michael Wilson', email: 'michael.wilson@example.com', role: 'Park Guide', status: 'Active', avatar: 'https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=150', registeredDate: '2023-06-18', certificates: 2 },
        ]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUsers();
  }, []);

  // 新用户表单处理函数
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewUser({
      ...newUser,
      [name]: value
    });
  };
  
  // 编辑用户表单处理函数
  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditingUser({
      ...editingUser,
      [name]: value
    });
  };
  
  // 打开编辑用户模态框
  const handleEditClick = (user) => {
    setEditingUser({
      id: user.id,
      username: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      password: '' // 密码字段为空，表示不修改密码
    });
    setFormError('');
    setShowEditUserModal(true);
  };
  
  // 打开删除用户确认模态框
  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };
  
  // 更新用户函数
  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    
    // 验证表单
    if (!editingUser.username || !editingUser.email) {
      setFormError('请填写必填字段');
      setSubmitting(false);
      return;
    }
    
    // 验证邮箱格式
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!emailRegex.test(editingUser.email)) {
      setFormError('请输入有效的电子邮箱地址');
      setSubmitting(false);
      return;
    }
    
    // 用户名长度验证
    if (editingUser.username.length < 3) {
      setFormError('用户名必须至少3个字符');
      setSubmitting(false);
      return;
    }
    
    try {
      // 准备提交数据，如果密码为空则不提交密码字段
      const userData = {
        username: editingUser.username,
        email: editingUser.email,
        role: editingUser.role,
        status: editingUser.status
      };
      
      // 仅当密码字段有值时才添加到请求中
      if (editingUser.password) {
        userData.password = editingUser.password;
      }
      
      // 调用API更新用户
      const backendUrl = 'http://localhost:3000';
      const response = await fetch(`${backendUrl}/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || '更新用户失败');
      }
      
      // 更新用户列表
      setUsers(users.map(user => 
        user.id === editingUser.id 
          ? { 
              ...user, 
              name: editingUser.username,
              email: editingUser.email,
              role: editingUser.role,
              status: editingUser.status 
            } 
          : user
      ));
      
      // 关闭模态框
      setShowEditUserModal(false);
      
    } catch (err) {
      console.error('Error updating user:', err);
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };
  
  // 删除用户函数
  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    
    setSubmitting(true);
    
    try {
      // 调用API删除用户
      const backendUrl = 'http://localhost:3000';
      const response = await fetch(`${backendUrl}/api/admin/users/${userToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || '删除用户失败');
      }
      
      // 从用户列表中移除被删除的用户
      setUsers(users.filter(user => user.id !== userToDelete.id));
      
      // 关闭模态框
      setShowDeleteModal(false);
      
    } catch (err) {
      console.error('Error deleting user:', err);
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };
  
  // 添加用户函数
  const handleAddUser = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    
    // 验证表单
    if (!newUser.username || !newUser.email || !newUser.password) {
      setFormError('Please fill in all required fields');
      setSubmitting(false);
      return;
    }
    
    // 验证邮箱格式
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!emailRegex.test(newUser.email)) {
      setFormError('Please enter a valid email address');
      setSubmitting(false);
      return;
    }
    
    // 用户名长度验证
    if (newUser.username.length < 3) {
      setFormError('Username must be at least 3 characters long');
      setSubmitting(false);
      return;
    }
    
    try {
      // 调用API创建用户
      const backendUrl = 'http://localhost:3000';
      const response = await fetch(`${backendUrl}/api/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newUser)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create user');
      }
      
      // 添加新用户到列表
      setUsers([data.user, ...users]);
      
      // 重置表单并关闭模态框
      setNewUser({
        username: '',
        email: '',
        password: '',
        role: 'user'
      });
      setShowAddUserModal(false);
      
    } catch (err) {
      console.error('Error creating user:', err);
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle search and filtering
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    
    return matchesSearch && matchesRole;
  });

  // Pagination
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  
  // Handle status class
  const getStatusClass = (status) => {
    switch(status) {
      case 'Active': return 'status-active';
      case 'Inactive': return 'status-inactive';
      case 'Pending': return 'status-pending';
      default: return '';
    }
  };

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterRole]);

  // Generate avatar from name if no avatar provided
  const getAvatarUrl = (name) => {
    // Use default avatar if name is not available
    if (!name) return 'https://ui-avatars.com/api/?name=User&background=4F46E5&color=fff';
    
    // Generate avatar based on name
    const encodedName = encodeURIComponent(name);
    return `https://ui-avatars.com/api/?name=${encodedName}&background=4F46E5&color=fff`;
  };

  return (
    <div className="users-container">
      {/* Sidebar Component */}
      <AdminSidebar activeLink={activeLink} setActiveLink={setActiveLink} />
      
      {/* Main Content */}
      <div className="main-content">
        <div className="users-header">
          <div>
            <h1>Users Management</h1>
            <p>View and manage all park guide users and administrators</p>
          </div>
          <div className="user-profile">
            <div className="notifications">
              <i className="far fa-bell"></i>
              <span className="notification-badge">3</span>
            </div>
            <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=40&h=40&auto=format&fit=crop" alt="Admin" className="user-avatar" />
          </div>
        </div>
        
        {/* Users Controls */}
        <div className="users-controls">
          <div className="search-filter-container">
            <div className="search-box">
              <i className="fas fa-search"></i>
              <input 
                type="text" 
                placeholder="Search users by name or email..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="filter-box">
              <select 
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
              >
                <option value="all">All Roles</option>
                <option value="Park Guide">Park Guides</option>
                <option value="Admin">Administrators</option>
                <option value="user">Regular Users</option>
              </select>
            </div>
          </div>
          <div className="user-actions">
            <button className="add-user-btn" onClick={() => setShowAddUserModal(true)}>
              <i className="fas fa-plus"></i> Add New User
            </button>
          </div>
        </div>
        
        {/* Loading State */}
        {loading && (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading users...</p>
          </div>
        )}
        
        {/* Error State */}
        {error && !loading && (
          <div className="error-container">
            <i className="fas fa-exclamation-circle"></i>
            <h3>Error loading users</h3>
            <p>{error}</p>
            <button onClick={() => window.location.reload()} className="retry-btn">
              <i className="fas fa-redo"></i> Retry
            </button>
          </div>
        )}
        
        {/* Users Table */}
        {!loading && !error && (
          <div className="users-table-container">
            <table className="users-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Registration Date</th>
                  <th>Certificates</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentUsers.map(user => (
                  <tr key={user.id} className="user-row">
                    <td className="user-info">
                      <img src={user.avatar || getAvatarUrl(user.name)} alt={user.name} className="user-table-avatar" />
                      <span>{user.name}</span>
                    </td>
                    <td>{user.email}</td>
                    <td>{user.role}</td>
                    <td>
                      <span className={`status-badge ${getStatusClass(user.status)}`}>
                        {user.status}
                      </span>
                    </td>
                    <td>{user.registeredDate}</td>
                    <td className="certificate-count">
                      <span className="badge">{user.certificates}</span>
                    </td>
                    <td className="action-buttons">
                      <button className="action-btn edit" onClick={() => handleEditClick(user)}>
                        <i className="fas fa-edit"></i>
                      </button>
                      <button className="action-btn delete" onClick={() => handleDeleteClick(user)}>
                        <i className="fas fa-trash-alt"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Pagination */}
        {!loading && !error && totalPages > 1 && (
          <div className="pagination">
            <button 
              className={`pagination-btn ${currentPage === 1 ? 'disabled' : ''}`}
              onClick={() => currentPage > 1 && paginate(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <i className="fas fa-chevron-left"></i>
            </button>
            
            {[...Array(totalPages)].map((_, index) => (
              <button
                key={index}
                className={`pagination-btn ${currentPage === index + 1 ? 'active' : ''}`}
                onClick={() => paginate(index + 1)}
              >
                {index + 1}
              </button>
            ))}
            
            <button 
              className={`pagination-btn ${currentPage === totalPages ? 'disabled' : ''}`}
              onClick={() => currentPage < totalPages && paginate(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <i className="fas fa-chevron-right"></i>
            </button>
          </div>
        )}
        
        {/* No results */}
        {!loading && !error && filteredUsers.length === 0 && (
          <div className="no-results">
            <i className="fas fa-search"></i>
            <h3>No users found</h3>
            <p>Try adjusting your search or filter criteria</p>
          </div>
        )}
        
        {/* Add User Modal */}
        {showAddUserModal && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h3>Add New User</h3>
                <button className="close-btn" onClick={() => setShowAddUserModal(false)}>
                  <i className="fas fa-times"></i>
                </button>
              </div>
              
              <form onSubmit={handleAddUser} className="add-user-form">
                {formError && <div className="form-error">{formError}</div>}
                
                <div className="form-group">
                  <label htmlFor="username">Username</label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={newUser.username}
                    onChange={handleInputChange}
                    placeholder="Enter username (min 3 characters)"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={newUser.email}
                    onChange={handleInputChange}
                    placeholder="Enter email address"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={newUser.password}
                    onChange={handleInputChange}
                    placeholder="Enter password"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="role">Role</label>
                  <select
                    id="role"
                    name="role"
                    value={newUser.role}
                    onChange={handleInputChange}
                  >
                    <option value="user">Regular User</option>
                    <option value="Park Guide">Park Guide</option>
                    <option value="Admin">Administrator</option>
                  </select>
                </div>
                
                <div className="form-actions">
                  <button 
                    type="button" 
                    className="cancel-btn" 
                    onClick={() => setShowAddUserModal(false)}
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="submit-btn"
                    disabled={submitting}
                  >
                    {submitting ? 'Creating...' : 'Create User'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        
        {/* Edit User Modal */}
        {showEditUserModal && editingUser && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h3>Edit User</h3>
                <button className="close-btn" onClick={() => setShowEditUserModal(false)}>
                  <i className="fas fa-times"></i>
                </button>
              </div>
              
              <form onSubmit={handleUpdateUser} className="add-user-form">
                {formError && <div className="form-error">{formError}</div>}
                
                <div className="form-group">
                  <label htmlFor="edit-username">Username</label>
                  <input
                    type="text"
                    id="edit-username"
                    name="username"
                    value={editingUser.username}
                    onChange={handleEditInputChange}
                    placeholder="Enter username (min 3 characters)"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="edit-email">Email</label>
                  <input
                    type="email"
                    id="edit-email"
                    name="email"
                    value={editingUser.email}
                    onChange={handleEditInputChange}
                    placeholder="Enter email address"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="edit-password">
                    Password <span className="optional-text">(leave blank to keep current)</span>
                  </label>
                  <input
                    type="password"
                    id="edit-password"
                    name="password"
                    value={editingUser.password}
                    onChange={handleEditInputChange}
                    placeholder="Enter new password (optional)"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="edit-role">Role</label>
                  <select
                    id="edit-role"
                    name="role"
                    value={editingUser.role}
                    onChange={handleEditInputChange}
                  >
                    <option value="user">Regular User</option>
                    <option value="Park Guide">Park Guide</option>
                    <option value="Admin">Administrator</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="edit-status">Status</label>
                  <select
                    id="edit-status"
                    name="status"
                    value={editingUser.status}
                    onChange={handleEditInputChange}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>
                
                <div className="form-actions">
                  <button 
                    type="button" 
                    className="cancel-btn" 
                    onClick={() => setShowEditUserModal(false)}
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="submit-btn"
                    disabled={submitting}
                  >
                    {submitting ? 'Updating...' : 'Update User'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        
        {/* Delete User Confirmation Modal */}
        {showDeleteModal && userToDelete && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h3>Confirm Deletion</h3>
                <button className="close-btn" onClick={() => setShowDeleteModal(false)}>
                  <i className="fas fa-times"></i>
                </button>
              </div>
              
              <div className="delete-confirm-content">
                <div className="delete-icon">
                  <i className="fas fa-exclamation-triangle"></i>
                </div>
                
                <p className="delete-message">
                  Are you sure you want to delete the user <strong>{userToDelete.name}</strong>?
                  <br />
                  This action cannot be undone.
                </p>
                
                {formError && <div className="form-error">{formError}</div>}
                
                <div className="form-actions">
                  <button 
                    type="button" 
                    className="cancel-btn" 
                    onClick={() => setShowDeleteModal(false)}
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button 
                    type="button" 
                    className="delete-btn"
                    onClick={handleDeleteUser}
                    disabled={submitting}
                  >
                    {submitting ? 'Deleting...' : 'Delete User'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Users;
