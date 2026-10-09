"use client";

import { useState } from "react";
import Link from "next/link";
import { LogOut, Package, MapPin, User } from "lucide-react";

export function AccountDashboardClient() {
  const [activeTab, setActiveTab] = useState("orders");

  const tabs = [
    { id: "orders", label: "Order History", icon: Package },
    { id: "addresses", label: "Addresses", icon: MapPin },
    { id: "profile", label: "Profile", icon: User },
  ];

  return (
    <div className="max-w-6xl mx-auto px-5 lg:px-10 py-16 md:py-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6 border-b border-border pb-8">
        <div>
          <h1 className="font-heading text-4xl md:text-5xl text-foreground mb-2">My Account</h1>
          <p className="font-body text-foreground/60">Welcome back, Amelie.</p>
        </div>
        <button className="flex items-center gap-2 font-body text-sm text-foreground/60 hover:text-foreground transition-colors uppercase tracking-[1.4px] font-medium">
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-12 lg:gap-20">
        
        {/* Sidebar Nav */}
        <div className="md:w-64 shrink-0">
          <nav className="flex flex-col gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg font-body text-sm text-left transition-colors ${
                    isActive 
                      ? "bg-input text-foreground font-medium" 
                      : "text-foreground/60 hover:bg-input/50 hover:text-foreground"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Main Content Area */}
        <div className="flex-1">
          {activeTab === "orders" && (
            <div className="flex flex-col gap-6">
              <h2 className="font-heading text-2xl text-foreground">Order History</h2>
              
              <div className="border border-border rounded-xl overflow-hidden bg-background">
                {/* Mock Order */}
                <div className="p-6 border-b border-border">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4 pb-4 border-b border-border/50">
                    <div>
                      <p className="font-body text-sm font-medium text-foreground">Order #AN-1092</p>
                      <p className="font-body text-xs text-foreground/60 mt-1">Placed on October 24, 2026</p>
                    </div>
                    <div className="flex flex-col sm:items-end">
                      <p className="font-body text-sm font-medium text-foreground">$124.00</p>
                      <span className="inline-block mt-1 px-2 py-1 bg-primary/10 text-primary rounded text-[10px] uppercase tracking-[1px] font-medium">Delivered</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-input rounded-md overflow-hidden relative">
                      {/* Placeholder Image */}
                      <div className="absolute inset-0 bg-foreground/5" />
                    </div>
                    <div className="font-body text-sm">
                      <p className="text-foreground">Salted Butter Caramel</p>
                      <p className="text-foreground/60 mt-1">Qty: 2</p>
                    </div>
                  </div>
                </div>

                {/* Mock Order */}
                <div className="p-6">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4 pb-4 border-b border-border/50">
                    <div>
                      <p className="font-body text-sm font-medium text-foreground">Order #AN-1085</p>
                      <p className="font-body text-xs text-foreground/60 mt-1">Placed on September 12, 2026</p>
                    </div>
                    <div className="flex flex-col sm:items-end">
                      <p className="font-body text-sm font-medium text-foreground">$56.00</p>
                      <span className="inline-block mt-1 px-2 py-1 bg-foreground/10 text-foreground/80 rounded text-[10px] uppercase tracking-[1px] font-medium">Delivered</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-input rounded-md overflow-hidden relative">
                      <div className="absolute inset-0 bg-foreground/5" />
                    </div>
                    <div className="font-body text-sm">
                      <p className="text-foreground">Angelina Hot Chocolate Mix</p>
                      <p className="text-foreground/60 mt-1">Qty: 1</p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {activeTab === "addresses" && (
            <div className="flex flex-col gap-6">
              <h2 className="font-heading text-2xl text-foreground">Saved Addresses</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="border border-border rounded-xl p-6 bg-input relative">
                  <span className="absolute top-6 right-6 text-[10px] uppercase tracking-[1px] font-medium bg-background px-2 py-1 rounded text-foreground">Default</span>
                  <p className="font-body text-sm font-medium text-foreground mb-2">Amelie Dupont</p>
                  <p className="font-body text-sm text-foreground/60 leading-[1.6]">
                    226 Rue de Rivoli<br />
                    75001 Paris<br />
                    France
                  </p>
                  <div className="mt-6 flex gap-4 font-body text-sm font-medium">
                    <button className="text-foreground hover:text-primary transition-colors">Edit</button>
                    <button className="text-foreground/60 hover:text-foreground transition-colors">Delete</button>
                  </div>
                </div>
                
                <button className="border border-dashed border-border rounded-xl p-6 flex flex-col items-center justify-center text-foreground/60 hover:text-foreground hover:border-foreground/30 hover:bg-input transition-all min-h-[200px]">
                  <Plus className="w-6 h-6 mb-2" />
                  <span className="font-body text-sm font-medium">Add New Address</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === "profile" && (
            <div className="flex flex-col gap-6">
              <h2 className="font-heading text-2xl text-foreground">Profile Details</h2>
              <form className="max-w-md flex flex-col gap-6" onSubmit={(e) => e.preventDefault()}>
                <div className="flex flex-col gap-2">
                  <label htmlFor="name" className="font-body text-xs uppercase tracking-[1.4px] text-foreground/80 font-medium">Full Name</label>
                  <input
                    type="text"
                    id="name"
                    defaultValue="Amelie Dupont"
                    className="w-full bg-background border border-border rounded-lg px-4 py-3 font-body text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="email" className="font-body text-xs uppercase tracking-[1.4px] text-foreground/80 font-medium">Email address</label>
                  <input
                    type="email"
                    id="email"
                    defaultValue="amelie@example.com"
                    className="w-full bg-background border border-border rounded-lg px-4 py-3 font-body text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  className="mt-2 w-full sm:w-auto self-start bg-foreground text-background font-body text-xs font-medium uppercase tracking-[0.25em] px-8 py-4 rounded-full hover:bg-primary transition-colors"
                >
                  Save Changes
                </button>
              </form>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

// Plus icon definition for the addresses tab since I forgot to import it
function Plus(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  );
}
