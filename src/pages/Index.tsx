import { useLocation } from "react-router-dom";
import { Users, Calendar, DollarSign, Shield } from "lucide-react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Header } from "@/components/dashboard/Header";
import { StatCard } from "@/components/dashboard/StatCard";
import { MembersTable } from "@/components/dashboard/MembersTable";
import { EventsList } from "@/components/dashboard/EventsList";
import { FinanceChart } from "@/components/dashboard/FinanceChart";
import { ComplianceStatus } from "@/components/dashboard/ComplianceStatus";
import { MembersPage } from "@/pages/MembersPage";
import { EventsPage } from "@/pages/EventsPage";
import { FinancesPage } from "@/pages/FinancesPage";
import { CompliancePage } from "@/pages/CompliancePage";

const Dashboard = () => (
  <>
    <Header 
      title="Dashboard" 
      subtitle="Welcome back! Here's what's happening with your organization."
    />

    {/* Stats Grid */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <StatCard
        title="Total Members"
        value="142"
        change="+12 this semester"
        changeType="positive"
        icon={Users}
        iconColor="text-primary"
        delay={0}
      />
      <StatCard
        title="Active Events"
        value="8"
        change="4 this month"
        changeType="neutral"
        icon={Calendar}
        iconColor="text-accent"
        delay={100}
      />
      <StatCard
        title="Treasury Balance"
        value="$8,260"
        change="+$2,400 this month"
        changeType="positive"
        icon={DollarSign}
        iconColor="text-success"
        delay={200}
      />
      <StatCard
        title="Compliance Score"
        value="85%"
        change="2 items pending"
        changeType="neutral"
        icon={Shield}
        iconColor="text-warning"
        delay={300}
      />
    </div>

    {/* Main Content Grid */}
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      {/* Left Column - Members Table */}
      <div className="xl:col-span-2">
        <MembersTable />
      </div>

      {/* Right Column - Events */}
      <div className="xl:col-span-1">
        <EventsList />
      </div>
    </div>

    {/* Bottom Grid */}
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">
      <FinanceChart />
      <ComplianceStatus />
    </div>
  </>
);

const SettingsPage = () => (
  <div className="p-6 sm:p-8">
    <div className="glass-card p-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-2">Settings</h1>
      <p className="text-muted-foreground mb-6">Manage your organization settings and preferences.</p>
      <div className="space-y-4">
        <div className="p-4 rounded-lg bg-secondary/30 border border-border/20">
          <h3 className="font-medium mb-1">Organization Profile</h3>
          <p className="text-sm text-muted-foreground">Update your organization's name, logo, and contact information.</p>
        </div>
        <div className="p-4 rounded-lg bg-secondary/30 border border-border/20">
          <h3 className="font-medium mb-1">Notification Preferences</h3>
          <p className="text-sm text-muted-foreground">Configure email and push notification settings.</p>
        </div>
        <div className="p-4 rounded-lg bg-secondary/30 border border-border/20">
          <h3 className="font-medium mb-1">Security</h3>
          <p className="text-sm text-muted-foreground">Manage passwords, two-factor authentication, and access controls.</p>
        </div>
        <div className="p-4 rounded-lg bg-secondary/30 border border-border/20">
          <h3 className="font-medium mb-1">Integrations</h3>
          <p className="text-sm text-muted-foreground">Connect with calendars, payment processors, and other services.</p>
        </div>
      </div>
    </div>
  </div>
);

const NotificationsPage = () => (
  <div className="p-6 sm:p-8">
    <h1 className="text-2xl font-bold mb-2">Notifications</h1>
    <p className="text-muted-foreground mb-6">Stay updated with organization activities.</p>
    <div className="space-y-3">
      {[
        { title: "New member request", desc: "David Williams requested to join the organization", time: "2 hours ago", unread: true },
        { title: "Upcoming event reminder", desc: "Spring Recruitment Week starts in 3 days", time: "5 hours ago", unread: true },
        { title: "Payment received", desc: "Member dues payment of $100 received from Sarah Mitchell", time: "1 day ago", unread: true },
        { title: "Compliance deadline approaching", desc: "Membership Roster Update is due in 2 days", time: "2 days ago", unread: false },
        { title: "Event attendance confirmed", desc: "15 new RSVPs for Alumni Networking Dinner", time: "3 days ago", unread: false },
      ].map((notif, i) => (
        <div 
          key={i} 
          className={`glass-card p-4 flex items-start gap-4 ${notif.unread ? 'border-primary/30' : ''}`}
        >
          <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${notif.unread ? 'bg-primary' : 'bg-muted'}`} />
          <div className="flex-1">
            <p className="font-medium">{notif.title}</p>
            <p className="text-sm text-muted-foreground">{notif.desc}</p>
            <p className="text-xs text-muted-foreground mt-2">{notif.time}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export function Index() {
  const location = useLocation();

  const renderContent = () => {
    switch (location.pathname) {
      case "/members":
        return <MembersPage />;
      case "/events":
        return <EventsPage />;
      case "/finances":
        return <FinancesPage />;
      case "/compliance":
        return <CompliancePage />;
      case "/settings":
        return <SettingsPage />;
      case "/notifications":
        return <NotificationsPage />;
      default:
        return (
          <div className="p-6 sm:p-8">
            <Dashboard />
          </div>
        );
    }
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      {/* This margin-left (lg:ml-64) pushes content right to make room for the fixed sidebar */}
      <main className="flex-1 overflow-auto lg:ml-64">
        {renderContent()}
      </main>
    </div>
  );
}

export default Index;
