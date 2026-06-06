'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuthStore } from '@/lib/store';
import { Plus, Users, UserPlus, ArrowLeft, Calendar, CheckCircle, Clock, AlertCircle, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Team {
  id: string;
  name: string;
  description?: string;
  _count: {
    members: number;
  };
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
}

interface Comment {
  id: string;
  text: string;
  author: string; // userId
  authorName: string;
  createdAt: Date;
  mentions?: string[]; // Array of userIds mentioned
}

interface Milestone {
  id: string;
  name: string;
  description: string;
  completed: boolean;
  completedBy?: string; // userId
  completedAt?: Date;
  approved: boolean;
  approvedBy?: string; // userId
  approvedAt?: Date;
  priority?: 'High' | 'Medium' | 'Low';
  dueDate?: Date;
  dependsOn?: string[]; // Array of milestone IDs that must be completed first
  timeSpent?: number; // Hours spent
  comments?: Comment[];
}

interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  progress: number;
  memberRoles?: Record<string, string>; // memberId -> role
  milestones?: Milestone[];
  priority?: 'High' | 'Medium' | 'Low';
  tags?: string[];
  comments?: Comment[];
}

interface Activity {
  id: string;
  type: 'milestone_completed' | 'milestone_approved' | 'comment_added' | 'project_created' | 'status_changed';
  projectId: string;
  projectName: string;
  userId: string;
  userName: string;
  timestamp: Date;
  details?: string;
}

interface Notification {
  id: string;
  type: 'mention' | 'milestone_completed' | 'milestone_approved' | 'comment_added';
  userId: string; // The user who should receive this notification
  fromUserId: string; // The user who triggered the notification
  fromUserName: string;
  projectId: string;
  projectName: string;
  milestoneId?: string;
  milestoneName?: string;
  commentText?: string;
  read: boolean;
  createdAt: Date;
}

interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  milestones: {name: string, description: string}[];
  tags?: string[];
}

// Mock data for demo
const mockTeams: Team[] = [
  {
    id: 't1',
    name: 'Engineering Team',
    description: 'Core product development team',
    _count: { members: 8 }
  },
  {
    id: 't2',
    name: 'Design Team',
    description: 'UI/UX and product design',
    _count: { members: 5 }
  },
  {
    id: 't3',
    name: 'Marketing Team',
    description: 'Growth and marketing initiatives',
    _count: { members: 4 }
  },
  {
    id: 't4',
    name: 'Operations Team',
    description: 'Infrastructure and operations',
    _count: { members: 3 }
  }
];

const mockTeamMembers: Record<string, TeamMember[]> = {
  't1': [
    { id: 'u1', name: 'John Doe', email: 'john@example.com', avatar: undefined, role: 'Lead Engineer' },
    { id: 'u2', name: 'Jane Smith', email: 'jane@example.com', avatar: undefined, role: 'Senior Engineer' },
    { id: 'u3', name: 'Bob Wilson', email: 'bob@example.com', avatar: undefined, role: 'Frontend Developer' },
    { id: 'u4', name: 'Alice Johnson', email: 'alice@example.com', avatar: undefined, role: 'Backend Developer' },
    { id: 'u5', name: 'Charlie Brown', email: 'charlie@example.com', avatar: undefined, role: 'DevOps Engineer' },
    { id: 'u6', name: 'Diana Prince', email: 'diana@example.com', avatar: undefined, role: 'QA Engineer' },
    { id: 'u7', name: 'Eve Davis', email: 'eve@example.com', avatar: undefined, role: 'Junior Developer' },
    { id: 'u8', name: 'Frank Miller', email: 'frank@example.com', avatar: undefined, role: 'Intern' },
  ],
  't2': [
    { id: 'u9', name: 'Grace Lee', email: 'grace@example.com', avatar: undefined, role: 'Design Lead' },
    { id: 'u10', name: 'Henry Chen', email: 'henry@example.com', avatar: undefined, role: 'UI Designer' },
    { id: 'u11', name: 'Ivy Wang', email: 'ivy@example.com', avatar: undefined, role: 'UX Designer' },
    { id: 'u12', name: 'Jack Taylor', email: 'jack@example.com', avatar: undefined, role: 'Product Designer' },
    { id: 'u13', name: 'Kelly White', email: 'kelly@example.com', avatar: undefined, role: 'Design Researcher' },
  ],
  't3': [
    { id: 'u14', name: 'Liam Brown', email: 'liam@example.com', avatar: undefined, role: 'Marketing Lead' },
    { id: 'u15', name: 'Mia Garcia', email: 'mia@example.com', avatar: undefined, role: 'Content Manager' },
    { id: 'u16', name: 'Noah Martinez', email: 'noah@example.com', avatar: undefined, role: 'SEO Specialist' },
    { id: 'u17', name: 'Olivia Rodriguez', email: 'olivia@example.com', avatar: undefined, role: 'Social Media Manager' },
  ],
  't4': [
    { id: 'u18', name: 'Paul Thompson', email: 'paul@example.com', avatar: undefined, role: 'Operations Lead' },
    { id: 'u19', name: 'Quinn Davis', email: 'quinn@example.com', avatar: undefined, role: 'System Admin' },
    { id: 'u20', name: 'Rachel Wilson', email: 'rachel@example.com', avatar: undefined, role: 'Support Specialist' },
  ]
};

const mockProjects: Record<string, Project[]> = {
  't1': [
    { id: 'p1', name: 'Mobile App v2.0', description: 'Complete rewrite of mobile application', status: 'In Progress', progress: 65, priority: 'High', tags: ['Mobile', 'Core'] },
    { id: 'p2', name: 'API Optimization', description: 'Improve API response times by 50%', status: 'In Progress', progress: 40, priority: 'Medium', tags: ['Backend', 'Performance'] },
    { id: 'p3', name: 'Security Audit', description: 'Complete security review and fixes', status: 'Completed', progress: 100, priority: 'High', tags: ['Security'] },
    { id: 'p4', name: 'Database Migration', description: 'Migrate to new database infrastructure', status: 'On Hold', progress: 20, priority: 'Low', tags: ['Infrastructure'] },
  ],
  't2': [
    { id: 'p5', name: 'Design System', description: 'Create comprehensive design system', status: 'In Progress', progress: 80, priority: 'High', tags: ['Design', 'Core'] },
    { id: 'p6', name: 'User Research', description: 'Conduct user interviews and surveys', status: 'Completed', progress: 100, priority: 'Medium', tags: ['Research'] },
    { id: 'p7', name: 'Brand Refresh', description: 'Update brand identity and guidelines', status: 'In Progress', progress: 55, priority: 'Medium', tags: ['Branding'] },
  ],
  't3': [
    { id: 'p8', name: 'Q4 Campaign', description: 'Launch holiday marketing campaign', status: 'In Progress', progress: 70, priority: 'High', tags: ['Marketing', 'Q4'] },
    { id: 'p9', name: 'Content Strategy', description: 'Develop content marketing strategy', status: 'Completed', progress: 100, priority: 'Medium', tags: ['Marketing'] },
  ],
  't4': [
    { id: 'p10', name: 'Infrastructure Upgrade', description: 'Upgrade server infrastructure', status: 'In Progress', progress: 45, priority: 'High', tags: ['Infrastructure'] },
    { id: 'p11', name: 'Support Portal', description: 'Build new customer support portal', status: 'Planning', progress: 10, priority: 'Low', tags: ['Support'] },
  ]
};

const projectTemplates: ProjectTemplate[] = [
  {
    id: 'tpl1',
    name: 'Mobile App Development',
    description: 'Standard mobile app development lifecycle',
    milestones: [
      { name: 'UI/UX Design', description: 'Design user interface and user experience' },
      { name: 'Frontend Development', description: 'Build the user interface' },
      { name: 'Backend Development', description: 'Build API and server logic' },
      { name: 'Integration', description: 'Connect frontend and backend' },
      { name: 'Testing', description: 'Test all features and fix bugs' },
      { name: 'Deployment', description: 'Deploy to production' }
    ],
    tags: ['Mobile', 'Development']
  },
  {
    id: 'tpl2',
    name: 'Website Development',
    description: 'Standard web development lifecycle',
    milestones: [
      { name: 'Design System', description: 'Create design system and components' },
      { name: 'Frontend Development', description: 'Build web pages and components' },
      { name: 'Backend API', description: 'Build REST API endpoints' },
      { name: 'Database Setup', description: 'Set up database and migrations' },
      { name: 'Testing & QA', description: 'Test functionality and performance' },
      { name: 'Launch', description: 'Deploy to production server' }
    ],
    tags: ['Web', 'Development']
  },
  {
    id: 'tpl3',
    name: 'API Development',
    description: 'Backend API development lifecycle',
    milestones: [
      { name: 'API Design', description: 'Design API endpoints and documentation' },
      { name: 'Database Schema', description: 'Design database structure' },
      { name: 'Authentication', description: 'Implement auth system' },
      { name: 'Core Features', description: 'Build main API endpoints' },
      { name: 'Testing', description: 'Write unit and integration tests' },
      { name: 'Documentation', description: 'Create API documentation' }
    ],
    tags: ['API', 'Backend']
  }
];

export default function TeamsPage() {
  const user = useAuthStore((state) => state.user);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [viewTeamDetail, setViewTeamDetail] = useState<Team | null>(null);
  const [viewProjectDetail, setViewProjectDetail] = useState<Project | null>(null);
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [newProjectDueDate, setNewProjectDueDate] = useState('');
  const [newProjectDetails, setNewProjectDetails] = useState('');
  const [newProjectRoles, setNewProjectRoles] = useState('');
  const [projectMemberRoles, setProjectMemberRoles] = useState<Record<string, string>>({});
  const [projectMilestones, setProjectMilestones] = useState<{name: string, description: string, dueDate?: string, priority?: 'High' | 'Medium' | 'Low', dependsOn?: string[]}[]>([]);
  const [newMilestoneName, setNewMilestoneName] = useState('');
  const [newMilestoneDescription, setNewMilestoneDescription] = useState('');
  const [newMilestoneDueDate, setNewMilestoneDueDate] = useState('');
  const [newMilestonePriority, setNewMilestonePriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [newMilestoneDependencies, setNewMilestoneDependencies] = useState<string[]>([]);
  const [projectPriority, setProjectPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [projectTags, setProjectTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate | null>(null);
  const [projects, setProjects] = useState<Record<string, Project[]>>(mockProjects);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [newMilestoneComment, setNewMilestoneComment] = useState<Record<string, string>>({});
  const [newProjectComment, setNewProjectComment] = useState('');
  const [showActivityFeed, setShowActivityFeed] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [mentionSuggestions, setMentionSuggestions] = useState<{show: boolean, query: string, position: {x: number, y: number}, targetInput: 'milestone' | 'project', milestoneId?: string}>({show: false, query: '', position: {x: 0, y: 0}, targetInput: 'project'});
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDescription, setNewTeamDescription] = useState('');
  const [memberEmail, setMemberEmail] = useState('');

  useEffect(() => {
    // Load mock data
    setTeams(mockTeams);
    setLoading(false);
  }, []);

  const loadTeams = () => {};
  const handleCreateTeam = (e: React.FormEvent) => {
    e.preventDefault();
    const newTeam: Team = {
      id: `t${Date.now()}`,
      name: newTeamName,
      description: newTeamDescription,
      _count: { members: 1 }
    };
    setTeams([...teams, newTeam]);
    setShowCreateModal(false);
    setNewTeamName('');
    setNewTeamDescription('');
  };
  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeam) return;
    // Update team member count
    setTeams(teams.map(t => 
      t.id === selectedTeam.id 
        ? { ...t, _count: { members: t._count.members + 1 } }
        : t
    ));
    // Also update viewTeamDetail if it's the same team
    if (viewTeamDetail?.id === selectedTeam.id) {
      setViewTeamDetail({ ...viewTeamDetail, _count: { members: viewTeamDetail._count.members + 1 } });
    }
    setShowAddMemberModal(false);
    setMemberEmail('');
    setSelectedTeam(null);
  };

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewTeamDetail) return;
    
    // Convert milestones to Milestone objects
    const milestones: Milestone[] = projectMilestones.map((m, index) => ({
      id: `m${Date.now()}-${index}`,
      name: m.name,
      description: m.description,
      completed: false,
      approved: false,
      priority: m.priority || 'Medium',
      dueDate: m.dueDate ? new Date(m.dueDate) : undefined,
      dependsOn: m.dependsOn || [],
      timeSpent: 0
    }));

    const newProject: Project = {
      id: `p${Date.now()}`,
      name: newProjectName,
      description: newProjectDescription,
      status: 'Planning',
      progress: 0,
      memberRoles: projectMemberRoles,
      milestones: milestones,
      priority: projectPriority,
      tags: projectTags
    };
    // Update projects state
    setProjects(prev => ({
      ...prev,
      [viewTeamDetail.id]: [...(prev[viewTeamDetail.id] || []), newProject]
    }));
    setShowCreateProjectModal(false);
    setNewProjectName('');
    setNewProjectDescription('');
    setNewProjectDueDate('');
    setNewProjectDetails('');
    setNewProjectRoles('');
    setProjectMemberRoles({});
    setProjectMilestones([]);
    setNewMilestoneName('');
    setNewMilestoneDescription('');
    setNewMilestoneDueDate('');
    setNewMilestonePriority('Medium');
    setNewMilestoneDependencies([]);
    setProjectPriority('Medium');
    setProjectTags([]);
    setNewTag('');
    setSelectedTemplate(null);
  };

  const addMilestone = () => {
    if (newMilestoneName.trim()) {
      setProjectMilestones([...projectMilestones, { 
        name: newMilestoneName, 
        description: newMilestoneDescription,
        dueDate: newMilestoneDueDate,
        priority: newMilestonePriority,
        dependsOn: newMilestoneDependencies
      }]);
      setNewMilestoneName('');
      setNewMilestoneDescription('');
      setNewMilestoneDueDate('');
      setNewMilestonePriority('Medium');
      setNewMilestoneDependencies([]);
    }
  };

  const removeMilestone = (index: number) => {
    setProjectMilestones(projectMilestones.filter((_, i) => i !== index));
  };

  const generateMilestones = () => {
    const title = newProjectName.toLowerCase();
    const description = newProjectDescription.toLowerCase();
    const keywords = [...title.split(' '), ...description.split(' ')];

    const generatedMilestones: {name: string, description: string}[] = [];

    // Common milestone templates based on project type
    if (keywords.some(k => k.includes('app') || k.includes('mobile') || k.includes('ios') || k.includes('android'))) {
      generatedMilestones.push(
        { name: 'UI/UX Design', description: 'Design user interface and user experience' },
        { name: 'Frontend Development', description: 'Build the user interface' },
        { name: 'Backend Development', description: 'Build API and server logic' },
        { name: 'Integration', description: 'Connect frontend and backend' },
        { name: 'Testing', description: 'Test all features and fix bugs' },
        { name: 'Deployment', description: 'Deploy to production' }
      );
    } else if (keywords.some(k => k.includes('website') || k.includes('web') || k.includes('portal'))) {
      generatedMilestones.push(
        { name: 'Design System', description: 'Create design system and components' },
        { name: 'Frontend Development', description: 'Build web pages and components' },
        { name: 'Backend API', description: 'Build REST API endpoints' },
        { name: 'Database Setup', description: 'Set up database and migrations' },
        { name: 'Testing & QA', description: 'Test functionality and performance' },
        { name: 'Launch', description: 'Deploy to production server' }
      );
    } else if (keywords.some(k => k.includes('api') || k.includes('backend') || k.includes('server'))) {
      generatedMilestones.push(
        { name: 'API Design', description: 'Design API endpoints and documentation' },
        { name: 'Database Schema', description: 'Design database structure' },
        { name: 'Authentication', description: 'Implement auth system' },
        { name: 'Core Features', description: 'Build main API endpoints' },
        { name: 'Testing', description: 'Write unit and integration tests' },
        { name: 'Documentation', description: 'Create API documentation' }
      );
    } else if (keywords.some(k => k.includes('design') || k.includes('ux') || k.includes('ui'))) {
      generatedMilestones.push(
        { name: 'Research', description: 'User research and requirements gathering' },
        { name: 'Wireframes', description: 'Create wireframes and mockups' },
        { name: 'Prototypes', description: 'Build interactive prototypes' },
        { name: 'Design System', description: 'Create design system and guidelines' },
        { name: 'User Testing', description: 'Test with real users' },
        { name: 'Final Design', description: 'Finalize and hand off to developers' }
      );
    } else if (keywords.some(k => k.includes('marketing') || k.includes('campaign'))) {
      generatedMilestones.push(
        { name: 'Strategy', description: 'Define marketing strategy and goals' },
        { name: 'Content Creation', description: 'Create marketing content and assets' },
        { name: 'Channel Setup', description: 'Set up marketing channels' },
        { name: 'Launch', description: 'Launch marketing campaign' },
        { name: 'Monitoring', description: 'Monitor and optimize performance' },
        { name: 'Analysis', description: 'Analyze results and report' }
      );
    } else {
      // Generic milestones for any project
      generatedMilestones.push(
        { name: 'Planning', description: 'Project planning and requirements' },
        { name: 'Design', description: 'Design phase' },
        { name: 'Development', description: 'Implementation phase' },
        { name: 'Testing', description: 'Testing and quality assurance' },
        { name: 'Review', description: 'Review and feedback' },
        { name: 'Completion', description: 'Final delivery and handoff' }
      );
    }

    setProjectMilestones(generatedMilestones);
  };

  const applyTemplate = (template: ProjectTemplate) => {
    setProjectMilestones(template.milestones);
    setProjectTags(template.tags || []);
    setSelectedTemplate(template);
  };

  const addTag = () => {
    if (newTag.trim() && !projectTags.includes(newTag.trim())) {
      setProjectTags([...projectTags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setProjectTags(projectTags.filter(t => t !== tag));
  };

  const calculateProgress = (milestones?: Milestone[]) => {
    if (!milestones || milestones.length === 0) return 0;
    const approvedMilestones = milestones.filter(m => m.approved).length;
    return Math.round((approvedMilestones / milestones.length) * 100);
  };

  const calculateStatus = (progress: number) => {
    if (progress === 0) return 'Planning';
    if (progress === 100) return 'Completed';
    return 'In Progress';
  };

  const handleUpdateProgress = (projectId: string, newProgress: number) => {
    if (!viewTeamDetail) return;
    setProjects(prev => ({
      ...prev,
      [viewTeamDetail.id]: prev[viewTeamDetail.id]?.map(p => 
        p.id === projectId ? { ...p, progress: newProgress } : p
      ) || []
    }));
    // Update viewProjectDetail if it's the same project
    if (viewProjectDetail?.id === projectId) {
      setViewProjectDetail({ ...viewProjectDetail, progress: newProgress });
    }
  };

  const handleUpdateStatus = (projectId: string, newStatus: string) => {
    if (!viewTeamDetail) return;
    setProjects(prev => ({
      ...prev,
      [viewTeamDetail.id]: prev[viewTeamDetail.id]?.map(p => 
        p.id === projectId ? { ...p, status: newStatus } : p
      ) || []
    }));
    // Update viewProjectDetail if it's the same project
    if (viewProjectDetail?.id === projectId) {
      setViewProjectDetail({ ...viewProjectDetail, status: newStatus });
    }
  };

  const handleCompleteMilestone = (milestoneId: string) => {
    if (!viewTeamDetail || !viewProjectDetail) return;
    
    // Check if dependencies are met
    const milestone = viewProjectDetail.milestones?.find(m => m.id === milestoneId);
    if (milestone?.dependsOn && milestone.dependsOn.length > 0) {
      const dependenciesMet = milestone.dependsOn.every(depId => 
        viewProjectDetail.milestones?.find(m => m.id === depId)?.approved
      );
      if (!dependenciesMet) {
        alert('This milestone depends on other milestones that must be approved first.');
        return;
      }
    }
    
    const updatedMilestones = viewProjectDetail.milestones?.map(m => 
      m.id === milestoneId 
        ? { ...m, completed: true, completedBy: user?.id, completedAt: new Date() }
        : m
    );
    const newProgress = calculateProgress(updatedMilestones);
    const newStatus = calculateStatus(newProgress);
    setProjects(prev => ({
      ...prev,
      [viewTeamDetail.id]: prev[viewTeamDetail.id]?.map(p => 
        p.id === viewProjectDetail.id 
          ? { ...p, milestones: updatedMilestones, progress: newProgress, status: newStatus }
          : p
      ) || []
    }));
    setViewProjectDetail({ ...viewProjectDetail, milestones: updatedMilestones, progress: newProgress, status: newStatus });
    addActivity('milestone_completed', viewProjectDetail.id, viewProjectDetail.name, `Completed milestone: ${milestone?.name}`);
  };

  const handleApproveMilestone = (milestoneId: string) => {
    if (!viewTeamDetail || !viewProjectDetail) return;
    const milestone = viewProjectDetail.milestones?.find(m => m.id === milestoneId);
    const updatedMilestones = viewProjectDetail.milestones?.map(m => 
      m.id === milestoneId 
        ? { ...m, approved: true, approvedBy: user?.id, approvedAt: new Date() }
        : m
    );
    const newProgress = calculateProgress(updatedMilestones);
    const newStatus = calculateStatus(newProgress);
    setProjects(prev => ({
      ...prev,
      [viewTeamDetail.id]: prev[viewTeamDetail.id]?.map(p => 
        p.id === viewProjectDetail.id 
          ? { ...p, milestones: updatedMilestones, progress: newProgress, status: newStatus }
          : p
      ) || []
    }));
    setViewProjectDetail({ ...viewProjectDetail, milestones: updatedMilestones, progress: newProgress, status: newStatus });
    addActivity('milestone_approved', viewProjectDetail.id, viewProjectDetail.name, `Approved milestone: ${milestone?.name}`);
  };

  const handleUpdateTimeSpent = (milestoneId: string, hours: number) => {
    if (!viewTeamDetail || !viewProjectDetail) return;
    const updatedMilestones = viewProjectDetail.milestones?.map(m => 
      m.id === milestoneId 
        ? { ...m, timeSpent: (m.timeSpent || 0) + hours }
        : m
    );
    setProjects(prev => ({
      ...prev,
      [viewTeamDetail.id]: prev[viewTeamDetail.id]?.map(p => 
        p.id === viewProjectDetail.id 
          ? { ...p, milestones: updatedMilestones }
          : p
      ) || []
    }));
    setViewProjectDetail({ ...viewProjectDetail, milestones: updatedMilestones });
  };

  const addActivity = (type: Activity['type'], projectId: string, projectName: string, details?: string) => {
    if (!user) return;
    const newActivity: Activity = {
      id: `act${Date.now()}`,
      type,
      projectId,
      projectName,
      userId: user.id,
      userName: user.name || user.email,
      timestamp: new Date(),
      details
    };
    setActivities(prev => [newActivity, ...prev]);
  };

  const parseMentions = (text: string): string[] => {
    const mentionRegex = /@(\w+)/g;
    const mentions: string[] = [];
    let match;
    while ((match = mentionRegex.exec(text)) !== null) {
      mentions.push(match[1]);
    }
    return mentions;
  };

  const createNotification = (notification: Omit<Notification, 'id' | 'read' | 'createdAt'>) => {
    const newNotification: Notification = {
      id: `notif${Date.now()}`,
      ...notification,
      read: false,
      createdAt: new Date()
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  const handleAddMilestoneComment = (milestoneId: string) => {
    if (!viewTeamDetail || !viewProjectDetail || !user || !newMilestoneComment[milestoneId]?.trim()) return;
    
    const text = newMilestoneComment[milestoneId];
    const mentions = parseMentions(text);
    const teamMembers = mockTeamMembers[viewTeamDetail.id] || [];
    
    const newComment: Comment = {
      id: `c${Date.now()}`,
      text,
      author: user.id,
      authorName: user.name || user.email,
      createdAt: new Date(),
      mentions
    };

    const milestone = viewProjectDetail.milestones?.find(m => m.id === milestoneId);

    const updatedMilestones = viewProjectDetail.milestones?.map(m => 
      m.id === milestoneId 
        ? { ...m, comments: [...(m.comments || []), newComment] }
        : m
    );

    setProjects(prev => ({
      ...prev,
      [viewTeamDetail.id]: prev[viewTeamDetail.id]?.map(p => 
        p.id === viewProjectDetail.id 
          ? { ...p, milestones: updatedMilestones }
          : p
      ) || []
    }));
    setViewProjectDetail({ ...viewProjectDetail, milestones: updatedMilestones });
    setNewMilestoneComment(prev => ({ ...prev, [milestoneId]: '' }));
    addActivity('comment_added', viewProjectDetail.id, viewProjectDetail.name, `Commented on milestone`);

    // Create notifications for mentioned users
    mentions.forEach(mentionedUsername => {
      const mentionedUser = teamMembers.find((m: TeamMember) => m.name.toLowerCase() === mentionedUsername.toLowerCase());
      if (mentionedUser) {
        createNotification({
          type: 'mention',
          userId: mentionedUser.id,
          fromUserId: user.id,
          fromUserName: user.name || user.email,
          projectId: viewProjectDetail.id,
          projectName: viewProjectDetail.name,
          milestoneId: milestoneId,
          milestoneName: milestone?.name,
          commentText: text
        });
      }
    });
  };

  const handleAddProjectComment = () => {
    if (!viewTeamDetail || !viewProjectDetail || !user || !newProjectComment.trim()) return;
    
    const text = newProjectComment;
    const mentions = parseMentions(text);
    const teamMembers = mockTeamMembers[viewTeamDetail.id] || [];
    
    const newComment: Comment = {
      id: `c${Date.now()}`,
      text,
      author: user.id,
      authorName: user.name || user.email,
      createdAt: new Date(),
      mentions
    };

    const updatedProject = {
      ...viewProjectDetail,
      comments: [...(viewProjectDetail.comments || []), newComment]
    };

    setProjects(prev => ({
      ...prev,
      [viewTeamDetail.id]: prev[viewTeamDetail.id]?.map(p => 
        p.id === viewProjectDetail.id 
          ? updatedProject
          : p
      ) || []
    }));
    setViewProjectDetail(updatedProject);
    setNewProjectComment('');
    addActivity('comment_added', viewProjectDetail.id, viewProjectDetail.name, `Commented on project`);

    // Create notifications for mentioned users
    mentions.forEach(mentionedUsername => {
      const mentionedUser = teamMembers.find((m: TeamMember) => m.name.toLowerCase() === mentionedUsername.toLowerCase());
      if (mentionedUser) {
        createNotification({
          type: 'mention',
          userId: mentionedUser.id,
          fromUserId: user.id,
          fromUserName: user.name || user.email,
          projectId: viewProjectDetail.id,
          projectName: viewProjectDetail.name,
          commentText: text
        });
      }
    });
  };

  const markNotificationAsRead = (notificationId: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === notificationId ? { ...n, read: true } : n
    ));
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter(n => !n.read && n.userId === user?.id).length;

  const handleCommentInputChange = (value: string, targetInput: 'milestone' | 'project', milestoneId?: string, event?: React.ChangeEvent<HTMLInputElement>) => {
    if (targetInput === 'milestone' && milestoneId) {
      setNewMilestoneComment(prev => ({ ...prev, [milestoneId]: value }));
    } else {
      setNewProjectComment(value);
    }

    // Detect @ for mention suggestions
    const cursorPosition = event?.target.selectionStart || value.length;
    const textBeforeCursor = value.substring(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex !== -1) {
      const query = textBeforeCursor.substring(lastAtIndex + 1);
      const spaceAfterAt = query.indexOf(' ');
      
      if (spaceAfterAt === -1) {
        // We're in a mention
        const inputRect = event?.target.getBoundingClientRect();
        setMentionSuggestions({
          show: true,
          query: query.toLowerCase(),
          position: { x: inputRect?.left || 0, y: (inputRect?.bottom || 0) + 5 },
          targetInput,
          milestoneId
        });
      } else {
        setMentionSuggestions(prev => ({ ...prev, show: false }));
      }
    } else {
      setMentionSuggestions(prev => ({ ...prev, show: false }));
    }
  };

  const selectMention = (username: string) => {
    const { targetInput, milestoneId } = mentionSuggestions;
    const currentValue = targetInput === 'milestone' && milestoneId 
      ? (newMilestoneComment[milestoneId] || '')
      : newProjectComment;
    
    const cursorPosition = currentValue.lastIndexOf('@');
    const newValue = currentValue.substring(0, cursorPosition) + `@${username} ` + currentValue.substring(cursorPosition + mentionSuggestions.query.length + 1);

    if (targetInput === 'milestone' && milestoneId) {
      setNewMilestoneComment(prev => ({ ...prev, [milestoneId]: newValue }));
    } else {
      setNewProjectComment(newValue);
    }

    setMentionSuggestions(prev => ({ ...prev, show: false }));
  };

  if (loading) {
    return (
      <DashboardLayout activeTab="teams">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
        </div>
      </DashboardLayout>
    );
  }

  // Project Detail View (must come before Team Detail View)
  if (viewProjectDetail && viewTeamDetail) {
    const teamMembers = mockTeamMembers[(viewTeamDetail as any).id] || [];

    return (
      <DashboardLayout activeTab="teams">
        <div className="relative">
          {/* Notification Bell */}
          <div className="absolute top-0 right-0 z-50">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-gray-600 hover:text-gray-900 transition"
            >
              <Bell className="w-6 h-6" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Notifications</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllNotificationsAsRead}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.filter(n => n.userId === user?.id).length === 0 ? (
                    <p className="p-4 text-sm text-gray-500">No notifications</p>
                  ) : (
                    notifications
                      .filter(n => n.userId === user?.id)
                      .map((notification) => (
                        <div
                          key={notification.id}
                          onClick={() => markNotificationAsRead(notification.id)}
                          className={cn(
                            "p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50",
                            !notification.read && "bg-blue-50"
                          )}
                        >
                          <div className="flex items-start space-x-3">
                            <div className="flex-1">
                              <p className="text-sm text-gray-900">
                                <span className="font-medium">{notification.fromUserName}</span>
                                {notification.type === 'mention' && ' mentioned you'}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {notification.milestoneName ? `in milestone: ${notification.milestoneName}` : `in project: ${notification.projectName}`}
                              </p>
                              {notification.commentText && (
                                <p className="text-sm text-gray-600 mt-2 italic">"{notification.commentText}"</p>
                              )}
                              <p className="text-xs text-gray-400 mt-2">{notification.createdAt.toLocaleString()}</p>
                            </div>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            )}
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6 pointer-events-auto">
          <button
            onClick={() => setViewProjectDetail(null)}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to {(viewTeamDetail as any).name}</span>
          </button>

          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h2 className="text-2xl font-bold text-gray-900">{viewProjectDetail.name}</h2>
                  {viewProjectDetail.priority && (
                    <span className={cn(
                      "text-sm px-2 py-1 rounded",
                      viewProjectDetail.priority === 'High' ? "bg-red-100 text-red-800" :
                      viewProjectDetail.priority === 'Medium' ? "bg-yellow-100 text-yellow-800" :
                      "bg-gray-100 text-gray-800"
                    )}>
                      {viewProjectDetail.priority} Priority
                    </span>
                  )}
                </div>
                <p className="text-gray-600">{viewProjectDetail.description}</p>
                {viewProjectDetail.tags && viewProjectDetail.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {viewProjectDetail.tags.map((tag) => (
                      <span key={tag} className="text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <span className={cn(
                "text-sm px-3 py-1 rounded-full",
                viewProjectDetail.status === 'Completed' ? "bg-green-100 text-green-800" :
                viewProjectDetail.status === 'In Progress' ? "bg-blue-100 text-blue-800" :
                viewProjectDetail.status === 'On Hold' ? "bg-yellow-100 text-yellow-800" :
                "bg-gray-100 text-gray-800"
              )}>
                {viewProjectDetail.status}
              </span>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                  <span>Progress (based on approved milestones)</span>
                  <span>{viewProjectDetail.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={cn(
                      "h-3 rounded-full transition-all",
                      viewProjectDetail.status === 'Completed' ? "bg-green-500" :
                      viewProjectDetail.status === 'In Progress' ? "bg-blue-500" :
                      viewProjectDetail.status === 'On Hold' ? "bg-yellow-500" :
                      "bg-gray-500"
                    )}
                    style={{ width: `${viewProjectDetail.progress}%` }}
                  ></div>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Status (auto-updated)</span>
                <span className={cn(
                  "px-3 py-1 rounded-full",
                  viewProjectDetail.status === 'Completed' ? "bg-green-100 text-green-800" :
                  viewProjectDetail.status === 'In Progress' ? "bg-blue-100 text-blue-800" :
                  viewProjectDetail.status === 'On Hold' ? "bg-yellow-100 text-yellow-800" :
                  "bg-gray-100 text-gray-800"
                )}>
                  {viewProjectDetail.status}
                </span>
              </div>
            </div>
          </div>

          {viewProjectDetail.milestones && viewProjectDetail.milestones.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Milestones</h3>
              <div className="space-y-3">
                {viewProjectDetail.milestones.map((milestone) => (
                  <div key={milestone.id} className={cn(
                    "p-4 rounded-lg border",
                    milestone.approved ? "bg-green-50 border-green-200" :
                    milestone.completed ? "bg-yellow-50 border-yellow-200" :
                    "bg-gray-50 border-gray-200"
                  )}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-medium text-gray-900">{milestone.name}</h4>
                          {milestone.priority && (
                            <span className={cn(
                              "text-xs px-1.5 py-0.5 rounded",
                              milestone.priority === 'High' ? "bg-red-100 text-red-800" :
                              milestone.priority === 'Medium' ? "bg-yellow-100 text-yellow-800" :
                              "bg-gray-100 text-gray-800"
                            )}>
                              {milestone.priority}
                            </span>
                          )}
                          {milestone.approved && (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Approved</span>
                          )}
                          {milestone.completed && !milestone.approved && (
                            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">Pending Approval</span>
                          )}
                        </div>
                        {milestone.description && <p className="text-sm text-gray-500 mt-1">{milestone.description}</p>}
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-400">
                          {milestone.dueDate && <span>Due: {milestone.dueDate.toLocaleDateString()}</span>}
                          {milestone.timeSpent !== undefined && <span>Time: {milestone.timeSpent}h</span>}
                        </div>
                        {milestone.completed && (
                          <p className="text-xs text-gray-400 mt-2">
                            Completed by {milestone.completedBy} at {milestone.completedAt?.toLocaleString()}
                          </p>
                        )}
                        {milestone.approved && (
                          <p className="text-xs text-gray-400 mt-2">
                            Approved by {milestone.approvedBy} at {milestone.approvedAt?.toLocaleString()}
                          </p>
                        )}
                        {milestone.comments && milestone.comments.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="text-xs font-medium text-gray-700 mb-2">Comments ({milestone.comments.length})</p>
                            <div className="space-y-2">
                              {milestone.comments.map((comment) => (
                                <div key={comment.id} className="bg-white p-2 rounded text-xs">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <span className="font-medium text-gray-900">{comment.authorName}</span>
                                    <span className="text-gray-400">{comment.createdAt.toLocaleString()}</span>
                                  </div>
                                  <p className="text-gray-600">{comment.text}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="flex space-x-2 relative">
                            <input
                              type="text"
                              placeholder="Add a comment... (use @username to mention)"
                              value={newMilestoneComment[milestone.id] || ''}
                              onChange={(e) => handleCommentInputChange(e.target.value, 'milestone', milestone.id, e)}
                              onKeyPress={(e) => e.key === 'Enter' && handleAddMilestoneComment(milestone.id)}
                              className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                            <button
                              onClick={() => handleAddMilestoneComment(milestone.id)}
                              className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                            >
                              Post
                            </button>
                            {mentionSuggestions.show && mentionSuggestions.targetInput === 'milestone' && mentionSuggestions.milestoneId === milestone.id && (
                              <div 
                                className="absolute top-full left-0 mt-1 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-48 overflow-y-auto"
                              >
                                {teamMembers
                                  .filter((m: TeamMember) => m.name.toLowerCase().includes(mentionSuggestions.query))
                                  .map((member: TeamMember) => (
                                    <div
                                      key={member.id}
                                      onClick={() => selectMention(member.name)}
                                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center space-x-2"
                                    >
                                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                        <span className="text-sm font-medium text-gray-600">{member.name.charAt(0)}</span>
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium text-gray-900">{member.name}</p>
                                        <p className="text-xs text-gray-500">{member.email}</p>
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col space-y-2 ml-4">
                        {!milestone.completed && (
                          <button
                            onClick={() => handleCompleteMilestone(milestone.id)}
                            className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm"
                          >
                            Mark Complete
                          </button>
                        )}
                        {milestone.completed && !milestone.approved && user?.role === 'LEAD_ENGINEER' && (
                          <button
                            onClick={() => handleApproveMilestone(milestone.id)}
                            className="px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 transition text-sm"
                          >
                            Approve
                          </button>
                        )}
                        <div className="flex items-center space-x-1">
                          <input
                            type="number"
                            placeholder="Hours"
                            min="0"
                            step="0.5"
                            className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                            id={`time-${milestone.id}`}
                          />
                          <button
                            onClick={() => {
                              const input = document.getElementById(`time-${milestone.id}`) as HTMLInputElement;
                              const hours = parseFloat(input.value);
                              if (hours > 0) {
                                handleUpdateTimeSpent(milestone.id, hours);
                                input.value = '';
                              }
                            }}
                            className="px-2 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition text-xs"
                          >
                            Log
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Project Comments</h3>
              <button
                onClick={() => setShowActivityFeed(!showActivityFeed)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {showActivityFeed ? 'Hide Activity' : 'Show Activity'}
              </button>
            </div>
            
            {showActivityFeed && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Activity Feed</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {activities.length === 0 ? (
                    <p className="text-sm text-gray-500">No activity yet</p>
                  ) : (
                    activities
                      .filter(a => a.projectId === viewProjectDetail.id)
                      .map((activity) => (
                        <div key={activity.id} className="text-xs text-gray-600">
                          <span className="font-medium">{activity.userName}</span>
                          <span className="text-gray-400 ml-2">{activity.timestamp.toLocaleString()}</span>
                          <p className="mt-1">{activity.details}</p>
                        </div>
                      ))
                  )}
                </div>
              </div>
            )}

            {viewProjectDetail.comments && viewProjectDetail.comments.length > 0 && (
              <div className="space-y-3 mb-4">
                {viewProjectDetail.comments.map((comment) => (
                  <div key={comment.id} className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium text-gray-900 text-sm">{comment.authorName}</span>
                      <span className="text-gray-400 text-xs">{comment.createdAt.toLocaleString()}</span>
                    </div>
                    <p className="text-gray-700 text-sm">{comment.text}</p>
                  </div>
                ))}
              </div>
            )}
            <div className="flex space-x-2 relative">
              <input
                type="text"
                placeholder="Add a project comment... (use @username to mention)"
                value={newProjectComment}
                onChange={(e) => handleCommentInputChange(e.target.value, 'project', undefined, e)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddProjectComment()}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 text-sm"
              />
              <button
                onClick={handleAddProjectComment}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm"
              >
                Post
              </button>
              {mentionSuggestions.show && mentionSuggestions.targetInput === 'project' && (
                <div 
                  className="absolute top-full left-0 mt-1 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-48 overflow-y-auto"
                >
                  {teamMembers
                    .filter((m: TeamMember) => m.name.toLowerCase().includes(mentionSuggestions.query))
                    .map((member: TeamMember) => (
                      <div
                        key={member.id}
                        onClick={() => selectMention(member.name)}
                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center space-x-2"
                      >
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-600">{member.name.charAt(0)}</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{member.name}</p>
                          <p className="text-xs text-gray-500">{member.email}</p>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>

          {viewProjectDetail.memberRoles && Object.keys(viewProjectDetail.memberRoles).length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Team Roles</h3>
              <div className="space-y-2">
                {Object.entries(viewProjectDetail.memberRoles).map(([memberId, role]) => {
                  const member = teamMembers.find(m => m.id === memberId);
                  if (!member) return null;
                  return (
                    <div key={memberId} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600">{member.name.charAt(0)}</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{member.name}</p>
                        <p className="text-sm text-gray-500">{member.email}</p>
                      </div>
                      <span className="text-sm text-gray-600 bg-white px-3 py-1 rounded-full border border-gray-200">
                        {role}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
      </DashboardLayout>
    );
  }

  // Team Detail View
  if (viewTeamDetail) {
    const teamMembers = mockTeamMembers[(viewTeamDetail as any).id] || [];
    const teamProjects = projects[(viewTeamDetail as any).id] || [];

    return (
      <DashboardLayout activeTab="teams">
        <div className="space-y-6 pointer-events-auto">
          <button
            onClick={() => setViewTeamDetail(null)}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Teams</span>
          </button>

          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{(viewTeamDetail as any).name}</h2>
            {viewTeamDetail.description && (
              <p className="text-gray-600">{viewTeamDetail.description}</p>
            )}
            <div className="flex items-center space-x-4 mt-4 text-sm text-gray-500">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>{teamMembers.length} members</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>{teamProjects.length} active projects</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pointer-events-auto">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Members</h3>
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="divide-y divide-gray-100">
                  {teamMembers.map((member) => (
                    <div key={member.id} className="p-4 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-600">
                            {member.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{member.name}</p>
                          <p className="text-sm text-gray-500">{member.email}</p>
                        </div>
                      </div>
                      <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                        {member.role}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pointer-events-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Current Projects</h3>
                <button
                  type="button"
                  onClick={() => {
                    console.log('Add Project button clicked');
                    console.log('Current showCreateProjectModal:', showCreateProjectModal);
                    console.log('Current viewTeamDetail:', viewTeamDetail);
                    setShowCreateProjectModal(true);
                    console.log('After setShowCreateProjectModal(true)');
                  }}
                  className="flex items-center space-x-2 text-sm bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Project</span>
                </button>
              </div>
              <div className="space-y-3">
                {teamProjects.map((project) => (
                  <div 
                    key={project.id} 
                    onClick={() => {
                      console.log('Project clicked:', project.name);
                      setViewProjectDetail(project);
                    }}
                    className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition cursor-pointer pointer-events-auto"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-medium text-gray-900">{project.name}</h4>
                          {project.priority && (
                            <span className={cn(
                              "text-xs px-2 py-0.5 rounded",
                              project.priority === 'High' ? "bg-red-100 text-red-800" :
                              project.priority === 'Medium' ? "bg-yellow-100 text-yellow-800" :
                              "bg-gray-100 text-gray-800"
                            )}>
                              {project.priority}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">{project.description}</p>
                        {project.tags && project.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {project.tags.map((tag) => (
                              <span key={tag} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <span className={cn(
                        "text-xs px-2 py-1 rounded-full",
                        project.status === 'Completed' ? "bg-green-100 text-green-800" :
                        project.status === 'In Progress' ? "bg-blue-100 text-blue-800" :
                        project.status === 'On Hold' ? "bg-yellow-100 text-yellow-800" :
                        "bg-gray-100 text-gray-800"
                      )}>
                        {project.status}
                      </span>
                    </div>
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-sm text-gray-500 mb-1">
                        <span>Progress</span>
                        <span>{project.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={cn(
                            "h-2 rounded-full transition-all",
                            project.status === 'Completed' ? "bg-green-500" :
                            project.status === 'In Progress' ? "bg-blue-500" :
                            project.status === 'On Hold' ? "bg-yellow-500" :
                            "bg-gray-500"
                          )}
                          style={{ width: `${project.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={cn("fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]", showCreateProjectModal ? "flex" : "hidden")}>
              <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Add Project to {(viewTeamDetail as any).name}
                </h3>

                <form onSubmit={handleCreateProject} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Project Name
                    </label>
                    <input
                      type="text"
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Description
                    </label>
                    <textarea
                      value={newProjectDescription}
                      onChange={(e) => setNewProjectDescription(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
                      rows={3}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Priority
                    </label>
                    <select
                      value={projectPriority}
                      onChange={(e) => setProjectPriority(e.target.value as 'High' | 'Medium' | 'Low')}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
                    >
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Tags
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {projectTags.map((tag) => (
                        <span key={tag} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center">
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="ml-2 text-blue-600 hover:text-blue-800"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        placeholder="Add tag..."
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addTag()}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 text-sm"
                      />
                      <button
                        type="button"
                        onClick={addTag}
                        className="px-3 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition text-sm"
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Use Template
                    </label>
                    <select
                      value={selectedTemplate?.id || ''}
                      onChange={(e) => {
                        const template = projectTemplates.find(t => t.id === e.target.value);
                        if (template) applyTemplate(template);
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
                    >
                      <option value="">Select a template...</option>
                      {projectTemplates.map((template) => (
                        <option key={template.id} value={template.id}>{template.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={newProjectDueDate}
                      onChange={(e) => setNewProjectDueDate(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Details
                    </label>
                    <textarea
                      value={newProjectDetails}
                      onChange={(e) => setNewProjectDetails(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
                      rows={4}
                      placeholder="Enter project details, requirements, specifications..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Roles & Responsibilities
                    </label>
                    <div className="space-y-2">
                      {mockTeamMembers[viewTeamDetail.id]?.map((member) => (
                        <div key={member.id} className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-medium text-gray-600">{member.name.charAt(0)}</span>
                          </div>
                          <span className="text-sm text-gray-900 flex-1">{member.name}</span>
                          <input
                            type="text"
                            placeholder="Project role..."
                            value={projectMemberRoles[member.id] || ''}
                            onChange={(e) => setProjectMemberRoles(prev => ({
                              ...prev,
                              [member.id]: e.target.value
                            }))}
                            className="flex-1 px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 text-sm"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Project Milestones
                    </label>
                    <div className="mb-3">
                      <button
                        type="button"
                        onClick={generateMilestones}
                        className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm"
                      >
                        ✨ Auto-Generate Milestones
                      </button>
                      <p className="text-xs text-gray-500 mt-1">AI will suggest milestones based on project type</p>
                    </div>
                    <div className="space-y-2 mb-3">
                      {projectMilestones.map((milestone, index) => (
                        <div key={index} className="flex items-center space-x-2 bg-gray-50 p-2 rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <p className="text-sm font-medium text-gray-900">{milestone.name}</p>
                              {milestone.priority && (
                                <span className={cn(
                                  "text-xs px-1.5 py-0.5 rounded",
                                  milestone.priority === 'High' ? "bg-red-100 text-red-800" :
                                  milestone.priority === 'Medium' ? "bg-yellow-100 text-yellow-800" :
                                  "bg-gray-100 text-gray-800"
                                )}>
                                  {milestone.priority}
                                </span>
                              )}
                            </div>
                            {milestone.description && <p className="text-xs text-gray-500">{milestone.description}</p>}
                            {milestone.dueDate && <p className="text-xs text-gray-400">Due: {milestone.dueDate}</p>}
                          </div>
                          <button
                            type="button"
                            onClick={() => removeMilestone(index)}
                            className="text-red-500 hover:text-red-700 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        placeholder="Milestone name..."
                        value={newMilestoneName}
                        onChange={(e) => setNewMilestoneName(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Description (optional)..."
                        value={newMilestoneDescription}
                        onChange={(e) => setNewMilestoneDescription(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 text-sm"
                      />
                      <input
                        type="date"
                        placeholder="Due date..."
                        value={newMilestoneDueDate}
                        onChange={(e) => setNewMilestoneDueDate(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 text-sm"
                      />
                      <select
                        value={newMilestonePriority}
                        onChange={(e) => setNewMilestonePriority(e.target.value as 'High' | 'Medium' | 'Low')}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 text-sm"
                      >
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                      </select>
                      <button
                        type="button"
                        onClick={addMilestone}
                        className="px-3 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition text-sm"
                      >
                        Add
                      </button>
                    </div>
                    {projectMilestones.length > 0 && (
                      <div className="mt-2">
                        <label className="block text-xs text-gray-500 mb-1">Depends on (optional):</label>
                        <div className="flex flex-wrap gap-1">
                          {projectMilestones.map((m, idx) => (
                            <label key={idx} className="flex items-center space-x-1 text-xs">
                              <input
                                type="checkbox"
                                checked={newMilestoneDependencies.includes(m.name)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setNewMilestoneDependencies([...newMilestoneDependencies, m.name]);
                                  } else {
                                    setNewMilestoneDependencies(newMilestoneDependencies.filter(d => d !== m.name));
                                  }
                                }}
                                className="rounded"
                              />
                              <span>{m.name}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex space-x-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateProjectModal(false);
                        setNewProjectName('');
                        setNewProjectDescription('');
                        setNewProjectDueDate('');
                        setNewProjectDetails('');
                        setNewProjectRoles('');
                        setProjectMemberRoles({});
                        setProjectMilestones([]);
                        setNewMilestoneName('');
                        setNewMilestoneDescription('');
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-gray-900"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition"
                    >
                      Add Project
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout activeTab="teams">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Teams</h2>
          {(user?.role === 'ADMIN' || user?.role === 'DIRECTOR' || user?.role === 'PROJECT_MANAGER' || user?.role === 'LEAD_ENGINEER') && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-2 bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Create Team</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team) => (
            <div
              key={team.id}
              onClick={() => setViewTeamDetail(team)}
              className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {team.name}
                  </h3>
                  {team.description && (
                    <p className="text-sm text-gray-500 mt-1">
                      {team.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center text-sm text-gray-500">
                <Users className="w-4 h-4 mr-2" />
                <span>{team._count.members} members</span>
              </div>

              {(user?.role === 'ADMIN' || user?.role === 'DIRECTOR' || user?.role === 'PROJECT_MANAGER' || user?.role === 'LEAD_ENGINEER') && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedTeam(team);
                    setShowAddMemberModal(true);
                  }}
                  className="mt-4 w-full flex items-center justify-center space-x-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg py-2 hover:bg-gray-50 transition"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Add Member</span>
                </button>
              )}
            </div>
          ))}
        </div>

        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Create New Team
              </h3>

              <form onSubmit={handleCreateTeam} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Team Name
                  </label>
                  <input
                    type="text"
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Description (optional)
                  </label>
                  <textarea
                    value={newTeamDescription}
                    onChange={(e) => setNewTeamDescription(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
                    rows={3}
                  />
                </div>

                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-gray-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition"
                  >
                    Create
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showAddMemberModal && selectedTeam && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Add Member to {selectedTeam.name}
              </h3>

              <form onSubmit={handleAddMember} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    User Email
                  </label>
                  <input
                    type="email"
                    value={memberEmail}
                    onChange={(e) => setMemberEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
                    placeholder="user@example.com"
                    required
                  />
                </div>

                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddMemberModal(false);
                      setMemberEmail('');
                      setSelectedTeam(null);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-gray-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition"
                  >
                    Add Member
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
