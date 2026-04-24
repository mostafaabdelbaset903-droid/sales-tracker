import { Metadata } from "next";
import { Navigation } from "@/components/navigation";
import { BulkImportManager } from "@/components/bulk-import-manager";

export const metadata: Metadata = {
  title: "Bulk Import Models | Sales Tracker",
  description: "Import multiple models at once from Excel or CSV",
};

export default function BulkImportPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">
            Bulk Import Models
          </h1>
          <p className="text-muted-foreground mt-1">
            Import multiple models at once from Excel, CSV, or by pasting data
          </p>
        </div>
        <BulkImportManager />
      </main>
    </div>
  );
}
