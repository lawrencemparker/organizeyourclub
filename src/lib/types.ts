// Member types
export interface Member {
  id: string;
  name?: string;
  full_name?: string;
  email: string;
  phone?: string;
  role: string;
  status: string;
  avatar?: string;
  // Add these two new fields:
  major?: string;
  gpa?: string;
}

// Event types
export interface OrgEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  attendees: number;
  type: "Recruitment" | "Social" | "Service" | "Meeting" | "Fundraiser" | "Other";
  status: "upcoming" | "ongoing" | "completed" | "cancelled";
  description?: string;
}

// Finance types
export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  date: string;
  payee?: string;
  notes?: string;
}

// Compliance types
export interface Requirement {
  id: string;
  title: string;
  description?: string;
  status: "complete" | "pending" | "overdue";
  dueDate: string;
  category: "registration" | "training" | "documentation" | "other";
  assignee?: string;
  completedDate?: string;
}
