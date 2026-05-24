import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getClassroomById, updateClassroom, deleteClassroomById } from "@/services/classroom-service";
import { uploadFile } from "@/services/file-service";
import NavLinksClass from "../components/NavLinksClass";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/shared/components/ui/dialog";
import { Settings, Upload, Trash2, FolderOpen } from "lucide-react";
import type { Classroom } from "@/shared/types";
import ChapterManager from "../components/ChapterManager";

const ClassSettings = () => {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    data: classroom,
    isLoading,
    error,
  } = useQuery<Classroom>({
    queryKey: ["classroom", classId],
    queryFn: () => getClassroomById(classId!),
    enabled: !!classId,
  });

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [section, setSection] = useState("");
  const [subject, setSubject] = useState("");
  const [chatEnabled, setChatEnabled] = useState(true);
  const [coverImage, setCoverImage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (classroom) {
      setName(classroom.name);
      setDescription(classroom.description ?? "");
      setSection(classroom.section ?? "");
      setSubject(classroom.subject ?? "");
      setChatEnabled(classroom.chatEnabled);
      setCoverImage(classroom.coverImage ?? "");
    }
  }, [classroom]);

  const update = useMutation({
    mutationFn: () =>
      updateClassroom(classId!, {
        name: name.trim(),
        description: description.trim() || undefined,
        section: section.trim() || undefined,
        subject: subject.trim() || undefined,
        chatEnabled,
        coverImage: coverImage || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classroom", classId] });
      queryClient.invalidateQueries({ queryKey: ["myClassrooms"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteClassroomById(classId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myClassrooms"] });
      navigate("/");
    },
  });

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setUploading(true);
    try {
      const uploaded = await uploadFile(file, classId, "classroom-cover");
      setCoverImage(uploaded.url || uploaded.fileKey);
    } catch {
      // upload failed
    } finally {
      setUploading(false);
    }
  };

  if (isLoading) return <div className="p-6 text-sm text-[#64748B]">Loading...</div>;
  if (error) return <div className="p-6 text-sm text-red-500">Error loading classroom</div>;

  if (classroom?.userRole !== "ADMIN") {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        Only admins can access classroom settings
      </div>
    );
  }

  const isCreator = classroom.creatorId === (localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")!).userId : "");

  return (
    <div className="flex h-full -mx-6 items-stretch overflow-hidden">
      <section className="flex min-h-0 flex-1 flex-col pb-4">
        <NavLinksClass
          classId={classId!}
          activeTab=""
          classroomType={classroom.type}
          userRole={classroom.userRole!}
          chatEnabled={classroom.chatEnabled}
        />
        <div className="flex-1 overflow-y-auto px-6 lg:px-20 pt-6">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-[#F1F5F9] flex items-center justify-center">
                <Settings className="w-5 h-5 text-[#64748B]" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[#0F172A]">Classroom Settings</h1>
                <p className="text-sm text-[#64748B]">Manage your classroom configuration</p>
              </div>
            </div>

            <div className="rounded-xl border border-[#E2E8F0] bg-white p-6 space-y-5">
              <div>
                <label className="text-sm font-medium text-[#334155]">Classroom Name</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1.5"
                  placeholder="e.g. Mathematics 101"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-[#334155]">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Optional description..."
                  className="mt-1.5 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-[#334155]">Section</label>
                  <Input
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    className="mt-1.5"
                    placeholder="e.g. Section A"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#334155]">Subject</label>
                  <Input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="mt-1.5"
                    placeholder="e.g. Mathematics"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-[#334155]">Cover Image</label>
                <div className="mt-1.5 flex items-center gap-3">
                  <label className="flex items-center gap-1.5 rounded-lg border border-dashed border-gray-300 px-3 py-2 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-500 transition-colors cursor-pointer">
                    <Upload className="w-4 h-4" />
                    {uploading ? "Uploading..." : "Upload image"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleCoverUpload}
                      disabled={uploading}
                    />
                  </label>
                  {coverImage && (
                    <span className="text-xs text-[#94A3B8] truncate max-w-48">
                      {coverImage.split("/").pop()}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-[#E2E8F0] px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-[#334155]">Group Chat</p>
                  <p className="text-xs text-[#94A3B8]">Allow members to chat in this classroom</p>
                </div>
                <button
                  type="button"
                  onClick={() => setChatEnabled(!chatEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                    chatEnabled ? "bg-[#137FEC]" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      chatEnabled ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button
                  onClick={() => update.mutate()}
                  disabled={!name.trim() || update.isPending || uploading}
                  className="bg-[#137FEC] hover:bg-[#1171d4] text-white"
                >
                  {update.isPending ? "Saving..." : saved ? "Saved!" : "Save Changes"}
                </Button>
                {update.isError && (
                  <p className="text-sm text-red-500">
                    {(update.error as any)?.response?.data?.error || "Failed to save"}
                  </p>
                )}
              </div>
            </div>

            {/* Chapters */}
            <div className="mt-6 rounded-xl border border-[#E2E8F0] bg-white p-6">
              <div className="flex items-center gap-2 mb-4">
                <FolderOpen className="w-5 h-5 text-[#64748B]" />
                <h3 className="text-sm font-semibold text-[#0F172A]">Chapters</h3>
              </div>
              <ChapterManager classId={classId!} chapters={classroom.chapters ?? []} />
            </div>

            {/* Danger zone */}
            {isCreator && (
              <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-6">
                <h3 className="text-sm font-semibold text-red-800 mb-1">Danger Zone</h3>
                <p className="text-xs text-red-600 mb-4">
                  Deleting this classroom is permanent. All posts, submissions, and chat history will be lost.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-red-300 text-red-600 hover:bg-red-100"
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2 className="w-4 h-4 mr-1.5" />
                  Delete Classroom
                </Button>

                <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                  <DialogContent className="sm:max-w-[400px]" showCloseButton={false}>
                    <DialogHeader>
                      <DialogTitle className="text-red-600">Delete Classroom</DialogTitle>
                      <DialogDescription>
                        Are you sure you want to delete <strong>{classroom.name}</strong>? This action cannot be undone.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button variant="ghost" onClick={() => setDeleteOpen(false)}>
                        Cancel
                      </Button>
                      <Button
                        onClick={() => deleteMutation.mutate()}
                        disabled={deleteMutation.isPending}
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        {deleteMutation.isPending ? "Deleting..." : "Delete"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default ClassSettings;
