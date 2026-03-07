import { useState, useEffect, useRef, DragEvent } from "react";
import { 
  Search, FileText, FolderOpen, Plus, Cloud, HardDrive, 
  Loader2, ExternalLink, Trash2, MoreVertical, ShieldCheck, 
  UploadCloud, X, Upload
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/PageHeader";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import useDrivePicker from "react-google-drive-picker";

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M7.71 3.501 1.15 15l3.43 6h12.49l-6.86-11.9H7.71Z" fill="#00AC47"/>
    <path d="M14.28 3.5 22.85 18.5h-6.86l-5.14-9H14.28Z" fill="#EA4335"/>
    <path d="M1.15 15 5.71 23h13.72l-4.57-8H1.15Z" fill="#2684FC"/>
  </svg>
);

export function DocumentsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [orgId, setOrgId] = useState<string | null>(null);
  const [uploaderName, setUploaderName] = useState<string>("");
  
  const [canCreate, setCanCreate] = useState(false);
  const [canDelete, setCanDelete] = useState(false);
  const [openDrivePicker] = useDrivePicker();

  // Native Upload State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [stagedFiles, setStagedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB limit

  useEffect(() => { 
    fetchDocumentsAndPermissions(); 
  }, [user]);

  async function fetchDocumentsAndPermissions() {
    if (!user) return;
    try {
      const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single();
      if (!profile?.organization_id) return;
      setOrgId(profile.organization_id);

      const { data: currentMember } = await supabase
        .from('members')
        .select('role, permissions, full_name')
        .eq('email', user.email)
        .eq('org_id', profile.organization_id)
        .maybeSingle();

      const role = currentMember?.role?.toLowerCase() || '';
      const isSuper = role === 'admin' || role === 'president';
      const perms = currentMember?.permissions?.['Documents'] || {};

      if (currentMember?.full_name) {
        setUploaderName(currentMember.full_name);
      }

      // ─── URL REDIRECT SECURITY ───
      if (!isSuper && perms.read === false) {
        toast.error("Access Denied: You do not have permission to view Documents.");
        navigate('/overview', { replace: true });
        return; 
      }

      setCanCreate(isSuper || !!perms.create);
      setCanDelete(isSuper || !!perms.delete);

      const { data: dbDocs, error } = await supabase
        .from('documents')
        .select('*')
        .eq('org_id', profile.organization_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(dbDocs || []);
    } catch (err) { 
      console.error("Error loading docs:", err); 
    } finally { 
      setLoading(false); 
    }
  }

  const handleOpenGooglePicker = () => {
    if (!orgId) return;
    openDrivePicker({
      clientId: "445602928145-04ou963ouaaodvrqkkriabkokdinkisl.apps.googleusercontent.com",
      developerKey: "AIzaSyDRn3b-rtO9Kob9H-p5e1dLK6JqHN4bbcA",
      viewId: "DOCS", 
      showUploadView: false, 
      customViews: [{ viewId: "DOCS", showItemDate: true }],
      showUploadFolders: true, 
      supportDrives: true, 
      multiselect: true,
      callbackFunction: async (data: any, authResponse: any) => {
        if (data.action === "picked") {
          toast.loading("Saving documents...");
          const newDocs = data.docs.map((doc: any) => ({
            org_id: orgId, 
            name: doc.name, 
            type: doc.mimeType.includes("pdf") ? "PDF" : "Google Doc", 
            size: "Cloud File", 
            source: 'google', 
            url: doc.url, 
            uploaded_by: uploaderName || user?.email || 'Unknown User',
            created_at: new Date().toISOString()
          }));
          const { error } = await supabase.from('documents').insert(newDocs);
          toast.dismiss();
          if (error) {
            toast.error("Failed to save documents.");
          } else { 
            toast.success(`${newDocs.length} document(s) added successfully!`); 
            fetchDocumentsAndPermissions(); 
          }
        }
      },
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this file?")) return;
    try {
      const { error } = await supabase.from('documents').delete().eq('id', id);
      if (error) throw error;
      toast.success("File removed"); 
      fetchDocumentsAndPermissions();
    } catch (err) { 
      toast.error("Failed to remove file"); 
    }
  };

  // ─── NATIVE DRAG & DROP UPLOAD LOGIC ───
  const processFiles = (files: FileList | File[]) => {
    const validFiles: File[] = [];
    
    // Define allowed MIME types including MS Word
    const allowedTypes = [
      'application/pdf', 
      'image/png', 
      'image/jpeg',
      'application/msword', // .doc
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // .docx
    ];
    
    Array.from(files).forEach(file => {
      const isValidType = allowedTypes.includes(file.type);
      const isValidSize = file.size <= MAX_FILE_SIZE;

      if (!isValidType) {
        toast.error(`Blocked: "${file.name}" is not a supported file type (.pdf, .doc, .docx, .png, .jpg only)`);
        return;
      }
      if (!isValidSize) {
        toast.error(`Blocked: "${file.name}" exceeds the strict 5MB limit.`);
        return;
      }
      
      // Prevent duplicates in staging
      if (stagedFiles.some(f => f.name === file.name && f.size === file.size)) return;
      
      validFiles.push(file);
    });

    if (validFiles.length > 0) {
      setStagedFiles(prev => [...prev, ...validFiles]);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
    // Reset input so the same file can be selected again if removed
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeStagedFile = (indexToRemove: number) => {
    setStagedFiles(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const executeUpload = async () => {
    if (!orgId || stagedFiles.length === 0) return;
    setIsUploading(true);
    toast.loading(`Uploading ${stagedFiles.length} file(s)...`);

    try {
      const uploadedDocs = [];

      for (const file of stagedFiles) {
        const fileExt = file.name.split('.').pop();
        const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '');
        const storagePath = `${orgId}/${Date.now()}_${safeName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('documents')
          .upload(storagePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('documents')
          .getPublicUrl(storagePath);
          
        // Determine type for badge display
        let docType = 'Document';
        if (file.type.includes('pdf')) docType = 'PDF';
        else if (file.type.includes('image')) docType = 'Image';
        else if (file.type.includes('word')) docType = 'Word Doc';

        uploadedDocs.push({
          org_id: orgId,
          name: file.name,
          type: docType,
          size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
          source: 'native',
          url: publicUrl,
          uploaded_by: uploaderName || user?.email || 'Unknown User',
          created_at: new Date().toISOString()
        });
      }

      // Insert metadata into database
      const { error: dbError } = await supabase.from('documents').insert(uploadedDocs);
      if (dbError) throw dbError;

      toast.dismiss();
      toast.success("Files successfully uploaded and secured!");
      setStagedFiles([]);
      setIsUploadModalOpen(false);
      fetchDocumentsAndPermissions();

    } catch (error: any) {
      toast.dismiss();
      toast.error(`Upload failed: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const filteredDocs = documents.filter(doc => doc.name.toLowerCase().includes(searchTerm.toLowerCase()));

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 space-y-8">
      <PageHeader 
        title="Documents" 
        subtitle="Centralized repository for all organization files."
        actions={
          canCreate && (
            <div className="flex gap-3">
              <Button onClick={() => setIsUploadModalOpen(true)} className="bg-[var(--primary)] text-white hover:opacity-90 shadow-md">
                <UploadCloud className="w-4 h-4 mr-2" /> 
                Upload Files
              </Button>
              <Button onClick={handleOpenGooglePicker} className="bg-white text-black hover:bg-gray-100 shadow-md border border-gray-200">
                <GoogleIcon /> 
                <span className="ml-2">Add from Drive</span>
              </Button>
            </div>
          )
        }
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-4 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500">
            <HardDrive className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase font-bold">Total Files</p>
            <p className="text-xl font-bold">{documents.length}</p>
          </div>
        </div>
        {/* Removed Static Security Badge */}
      </div>
      
      <div className="glass-card min-h-[500px] flex flex-col">
        <Tabs defaultValue="all" className="w-full">
          <div className="p-4 border-b border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <TabsList className="bg-white/5">
              <TabsTrigger value="all">All Files</TabsTrigger>
            </TabsList>
            
            <div className="relative w-full sm:max-w-sm">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search by name..." 
                className="pl-9 bg-black/20 border-white/10" 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
              />
            </div>
          </div>
          
          <TabsContent value="all" className="m-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-muted-foreground font-medium border-b border-white/5 bg-white/5">
                  <tr>
                    <th className="px-6 py-3">Name</th>
                    <th className="px-6 py-3">Source</th>
                    <th className="px-6 py-3">Type</th>
                    <th className="px-6 py-3">Date Added</th>
                    <th className="px-6 py-3">Uploaded By</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredDocs.map((doc) => (
                    <tr key={doc.id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded bg-white/5 text-[var(--primary)]">
                            <FileText className="w-4 h-4" />
                          </div>
                          <span className="font-medium text-foreground">{doc.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {doc.source === 'google' ? (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <GoogleIcon /> Drive
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <HardDrive className="w-4 h-4" /> Native
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="secondary" className="bg-white/10 hover:bg-white/20">
                          {doc.type}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {new Date(doc.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {doc.uploaded_by || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {canDelete && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem className="text-red-500" onClick={() => handleDelete(doc.id)}>
                                  <Trash2 className="w-4 h-4 mr-2" /> Remove from App
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                          <Button variant="default" className="bg-white/10 hover:bg-[var(--primary)] text-white" onClick={() => window.open(doc.url, '_blank')}>
                            <ExternalLink className="w-4 h-4 mr-2" /> Open
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredDocs.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-muted-foreground">
                        No documents found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* ─── NATIVE UPLOAD MODAL ─── */}
      <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
        <DialogContent className="sm:max-w-[600px] bg-[#0B0F1A] border-white/10 text-white shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-[var(--primary)]" />
              Upload Static Assets
            </DialogTitle>
            <DialogDescription className="text-muted-foreground pt-2 leading-relaxed">
              Please only upload standard, day-to-day club files (e.g., expense receipts, single-page flyers, multi-page bylaws, or meeting minutes). <br/>
              <span className="font-semibold text-white/80">Max 5MB per file. Accepted formats: .PDF, .DOC, .DOCX, .PNG, .JPG.</span> <br/>
              For living documents, presentations, and large media, please use the Google Drive integration.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            {/* DRAG AND DROP ZONE */}
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`
                relative w-full h-48 rounded-xl border-2 border-dashed flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all duration-200
                ${isDragging ? 'border-[var(--primary)] bg-[var(--primary)]/5' : 'border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/30'}
              `}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileInput} 
                className="hidden" 
                multiple 
                accept=".pdf, .png, .jpg, .jpeg, .doc, .docx"
              />
              <div className="p-4 rounded-full bg-white/5 mb-3 pointer-events-none">
                <UploadCloud className={`w-8 h-8 ${isDragging ? 'text-[var(--primary)]' : 'text-muted-foreground'}`} />
              </div>
              <p className="text-sm font-medium pointer-events-none">
                <span className="text-[var(--primary)]">Click to browse</span> or drag and drop files here
              </p>
            </div>

            {/* STAGED FILES LIST WITH CUSTOM SCROLLBAR */}
            {stagedFiles.length > 0 && (
              <div className="space-y-2 mt-6">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Ready to upload ({stagedFiles.length})</p>
                <div className="max-h-48 overflow-y-auto space-y-2 pr-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-white/20">
                  {stagedFiles.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10 group">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="p-2 rounded bg-white/10 text-white shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="truncate">
                          <p className="text-sm font-medium truncate">{file.name}</p>
                          <p className="text-xs text-muted-foreground">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={(e) => { e.stopPropagation(); removeStagedFile(idx); }}
                        className="text-muted-foreground hover:text-red-400 hover:bg-red-400/10 shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-white/10 mt-6">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                setStagedFiles([]);
                setIsUploadModalOpen(false);
              }} 
              className="border-white/10 text-muted-foreground hover:text-white bg-transparent"
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button 
              onClick={executeUpload} 
              disabled={stagedFiles.length === 0 || isUploading} 
              className="bg-[var(--primary)] text-white hover:opacity-90 min-w-[120px]"
            >
              {isUploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
              {isUploading ? "Uploading..." : `Upload ${stagedFiles.length > 0 ? `(${stagedFiles.length})` : ''}`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}