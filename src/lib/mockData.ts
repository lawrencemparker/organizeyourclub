import { Member, OrgEvent, Transaction, Requirement } from "./types";

export const initialMembers: Member[] = [
  {
    id: "1",
    name: "Sarah Mitchell",
    email: "sarah.m@university.edu",
    phone: "(555) 123-4567",
    role: "Vice President",
    status: "Active",
    joined: "Aug 2023",
    avatar: "SM",
    gpa: 3.8,
    major: "Business Administration"
  },
  {
    id: "2",
    name: "Marcus Johnson",
    email: "m.johnson@university.edu",
    phone: "(555) 234-5678",
    role: "Treasurer",
    status: "Active",
    joined: "Sep 2023",
    avatar: "MJ",
    gpa: 3.5,
    major: "Finance"
  },
  {
    id: "3",
    name: "Emily Chen",
    email: "e.chen@university.edu",
    phone: "(555) 345-6789",
    role: "Secretary",
    status: "Active",
    joined: "Sep 2023",
    avatar: "EC",
    gpa: 3.9,
    major: "Communications"
  },
  {
    id: "4",
    name: "David Williams",
    email: "d.williams@university.edu",
    phone: "(555) 456-7890",
    role: "Member",
    status: "Pending",
    joined: "Jan 2024",
    avatar: "DW",
    gpa: 3.2,
    major: "Computer Science"
  },
  {
    id: "5",
    name: "Jessica Brown",
    email: "j.brown@university.edu",
    phone: "(555) 567-8901",
    role: "Social Chair",
    status: "Active",
    joined: "Oct 2023",
    avatar: "JB",
    gpa: 3.6,
    major: "Marketing"
  },
  {
    id: "6",
    name: "Michael Lee",
    email: "m.lee@university.edu",
    phone: "(555) 678-9012",
    role: "Rush Chair",
    status: "Active",
    joined: "Aug 2023",
    avatar: "ML",
    gpa: 3.4,
    major: "Psychology"
  },
  {
    id: "7",
    name: "Amanda Garcia",
    email: "a.garcia@university.edu",
    phone: "(555) 789-0123",
    role: "Member",
    status: "Inactive",
    joined: "Sep 2022",
    avatar: "AG",
    gpa: 3.1,
    major: "Biology"
  },
];

export const initialEvents: OrgEvent[] = [
  {
    id: "1",
    title: "Spring Recruitment Week",
    date: "Feb 15-22, 2024",
    time: "All Day",
    location: "Student Union",
    attendees: 45,
    type: "Recruitment",
    status: "upcoming",
    description: "Main recruitment event for new members"
  },
  {
    id: "2",
    title: "Alumni Networking Dinner",
    date: "Feb 28, 2024",
    time: "6:00 PM",
    location: "Grand Ballroom",
    attendees: 120,
    type: "Social",
    status: "upcoming",
    description: "Annual networking dinner with alumni"
  },
  {
    id: "3",
    title: "Community Service Day",
    date: "Mar 5, 2024",
    time: "9:00 AM",
    location: "City Park",
    attendees: 32,
    type: "Service",
    status: "upcoming",
    description: "Park cleanup and community beautification"
  },
  {
    id: "4",
    title: "Chapter Meeting",
    date: "Mar 10, 2024",
    time: "7:00 PM",
    location: "Chapter House",
    attendees: 58,
    type: "Meeting",
    status: "upcoming",
    description: "Weekly chapter meeting"
  },
  {
    id: "5",
    title: "Charity Gala",
    date: "Mar 20, 2024",
    time: "7:00 PM",
    location: "University Center",
    attendees: 150,
    type: "Fundraiser",
    status: "upcoming",
    description: "Annual charity fundraiser event"
  },
];

export const initialTransactions: Transaction[] = [
  {
    id: "1",
    description: "Member Dues Collection",
    amount: 2400,
    type: "income",
    category: "Dues",
    date: "Feb 8, 2024",
    notes: "Monthly dues from 24 members"
  },
  {
    id: "2",
    description: "Event Supplies",
    amount: 320,
    type: "expense",
    category: "Events",
    date: "Feb 7, 2024",
    payee: "Party City"
  },
  {
    id: "3",
    description: "Venue Deposit",
    amount: 500,
    type: "expense",
    category: "Events",
    date: "Feb 5, 2024",
    payee: "Grand Ballroom"
  },
  {
    id: "4",
    description: "Sponsorship - Local Business",
    amount: 1000,
    type: "income",
    category: "Sponsorship",
    date: "Feb 3, 2024",
    notes: "Acme Corp sponsorship"
  },
  {
    id: "5",
    description: "T-Shirt Printing",
    amount: 280,
    type: "expense",
    category: "Merchandise",
    date: "Feb 1, 2024",
    payee: "Custom Ink"
  },
  {
    id: "6",
    description: "Chapter Insurance",
    amount: 1200,
    type: "expense",
    category: "Insurance",
    date: "Jan 28, 2024",
    payee: "National Org"
  },
  {
    id: "7",
    description: "Fundraiser Proceeds",
    amount: 850,
    type: "income",
    category: "Fundraising",
    date: "Jan 25, 2024",
    notes: "Car wash fundraiser"
  },
];

export const initialRequirements: Requirement[] = [
  {
    id: "1",
    title: "Chapter Registration",
    description: "Annual registration with university",
    status: "complete",
    dueDate: "Jan 15, 2024",
    category: "registration",
    completedDate: "Jan 10, 2024"
  },
  {
    id: "2",
    title: "Hazing Prevention Training",
    description: "All members must complete online training",
    status: "complete",
    dueDate: "Feb 1, 2024",
    category: "training",
    completedDate: "Jan 28, 2024"
  },
  {
    id: "3",
    title: "Officer Training",
    description: "Leadership training for all officers",
    status: "pending",
    dueDate: "Mar 1, 2024",
    category: "training",
    assignee: "Executive Board"
  },
  {
    id: "4",
    title: "Risk Management Plan",
    description: "Submit updated risk management documentation",
    status: "pending",
    dueDate: "Mar 15, 2024",
    category: "documentation",
    assignee: "Risk Manager"
  },
  {
    id: "5",
    title: "Membership Roster Update",
    description: "Submit current roster to national",
    status: "overdue",
    dueDate: "Feb 5, 2024",
    category: "registration",
    assignee: "Secretary"
  },
  {
    id: "6",
    title: "Financial Audit",
    description: "Annual financial review",
    status: "pending",
    dueDate: "Apr 1, 2024",
    category: "documentation",
    assignee: "Treasurer"
  },
];
