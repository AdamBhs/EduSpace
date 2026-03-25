import NavLinksClass from "../components/NavLinksClass";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import PeopleSkeleton from "../ui/PeopleSkeleton";
import { getClassroomById } from "@/services/classroom-service";
import { IoMdExpand } from "react-icons/io";
import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { MdOutlineEdit } from "react-icons/md";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import {
  Cloud,
  Link2,
  Paperclip,
  PlayCircle,
  ChevronDown,
} from "lucide-react";

type YoutubeResult = {
  id: string;
  title: string;
  channelTitle: string;
  thumbnail: string;
  url: string;
};

const Stream = () => {
  const { classId } = useParams<{ classId: string }>();
  const user = JSON.parse(localStorage.getItem("user")!); // Return Object
  const [postDialogOpen, setPostDialogOpen] = useState(false);
  const [postForm, setPostForm] = useState({
    message: "",
  });
  const [pickerReady, setPickerReady] = useState(false);
  const [gisReady, setGisReady] = useState(false);
  const tokenClientRef = useRef<any>(null);
  const accessTokenRef = useRef<string | null>(null);
  const [ytOpen, setYtOpen] = useState(false);
  const [ytQuery, setYtQuery] = useState("");
  const [ytResults, setYtResults] = useState<YoutubeResult[]>([]);
  const [ytLoading, setYtLoading] = useState(false);
  const [ytError, setYtError] = useState<string | null>(null);
  const [selectedYoutube, setSelectedYoutube] =
    useState<YoutubeResult | null>(null);

  const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY as
    | string
    | undefined;
  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as
    | string
    | undefined;
  const GOOGLE_APP_ID = import.meta.env.VITE_GOOGLE_APP_ID as
    | string
    | undefined;
  const isGoogleConfigured =
    !!GOOGLE_API_KEY && !!GOOGLE_CLIENT_ID && !!GOOGLE_APP_ID;
  const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY as
    | string
    | undefined;

  const loadScript = (src: string) =>
    new Promise<void>((resolve, reject) => {
      const existing = document.querySelector(
        `script[src="${src}"]`,
      ) as HTMLScriptElement | null;
      if (existing?.dataset.loaded === "true") return resolve();
      if (existing) {
        existing.addEventListener("load", () => resolve());
        existing.addEventListener("error", () =>
          reject(new Error(`Failed to load ${src}`)),
        );
        return;
      }
      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        script.dataset.loaded = "true";
        resolve();
      };
      script.onerror = () => reject(new Error(`Failed to load ${src}`));
      document.body.appendChild(script);
    });

  useEffect(() => {
    if (!isGoogleConfigured) return;
    let cancelled = false;

    loadScript("https://apis.google.com/js/api.js")
      .then(() => {
        const g = (window as any).gapi;
        if (!g?.load || cancelled) return;
        g.load("picker", () => {
          if (!cancelled) setPickerReady(true);
        });
      })
      .catch((err) => console.error(err));

    loadScript("https://accounts.google.com/gsi/client")
      .then(() => {
        if (cancelled) return;
        const google = (window as any).google;
        if (!google?.accounts?.oauth2?.initTokenClient) return;
        tokenClientRef.current = google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope:
            "https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.readonly",
          callback: () => {},
        });
        setGisReady(true);
      })
      .catch((err) => console.error(err));

    return () => {
      cancelled = true;
    };
  }, [GOOGLE_API_KEY, GOOGLE_CLIENT_ID, GOOGLE_APP_ID, isGoogleConfigured]);

  const {
    data: classroom,
    isLoading: classLoading,
    error: classError,
  } = useQuery({
    queryKey: ["classroom", classId],
    queryFn: () => getClassroomById(classId!),
    enabled: !!classId,
  });

  if (classLoading) return <PeopleSkeleton />;
  if (classError) return <p>Error loading data</p>;

  const isTeacher = user.userId === classroom.teacher_id;

  const handlePostChange = (value: string) => {
    setPostForm({ message: value });
  };

  const handlePostClose = (open: boolean) => {
    setPostDialogOpen(open);
    if (!open) {
      setPostForm({ message: "" });
    }
  };

  const handlePostSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!postForm.message.trim()) return;
    console.log("Stream post draft:", {
      ...postForm,
      youtube: selectedYoutube,
    });
    setPostForm({ message: "" });
    setPostDialogOpen(false);
  };

  const handleGoogleDriveClick = () => {
    if (!isGoogleConfigured) {
      console.warn(
        "Google Picker is not configured. Set VITE_GOOGLE_API_KEY, VITE_GOOGLE_CLIENT_ID, and VITE_GOOGLE_APP_ID.",
      );
      return;
    }
    if (!pickerReady || !gisReady || !tokenClientRef.current) return;

    const google = (window as any).google;
    const showPicker = (token: string) => {
      const view = new google.picker.DocsView(google.picker.ViewId.DOCS);
      view.setIncludeFolders(true);
      view.setSelectFolderEnabled(true);

      const picker = new google.picker.PickerBuilder()
        .setAppId(GOOGLE_APP_ID)
        .setDeveloperKey(GOOGLE_API_KEY)
        .setOAuthToken(token)
        .addView(view)
        .addView(new google.picker.DocsUploadView())
        .setCallback((data: any) => {
          if (data?.action === google.picker.Action.PICKED) {
            console.log("Picker selection:", data);
          }
        })
        .build();
      picker.setVisible(true);
    };

    tokenClientRef.current.callback = (response: any) => {
      if (response?.error) {
        console.error("Google token error:", response);
        return;
      }
      accessTokenRef.current = response.access_token;
      showPicker(response.access_token);
    };

    tokenClientRef.current.requestAccessToken({
      prompt: accessTokenRef.current ? "" : "consent",
    });
  };

  const handleYoutubeClick = () => {
    if (!YOUTUBE_API_KEY) {
      setYtError("Missing YouTube API key.");
      setYtOpen(true);
      return;
    }
    setYtError(null);
    setYtOpen(true);
  };

  const handleYoutubeSearch = async () => {
    if (!YOUTUBE_API_KEY) {
      setYtError("Missing YouTube API key.");
      return;
    }
    if (!ytQuery.trim()) return;
    setYtLoading(true);
    setYtError(null);
    try {
      const url = new URL("https://www.googleapis.com/youtube/v3/search");
      url.searchParams.set("part", "snippet");
      url.searchParams.set("type", "video");
      url.searchParams.set("maxResults", "6");
      url.searchParams.set("q", ytQuery.trim());
      url.searchParams.set("key", YOUTUBE_API_KEY);
      const res = await fetch(url.toString());
      const data = await res.json();
      if (!res.ok) {
        const message = data?.error?.message || "Failed to fetch videos.";
        throw new Error(message);
      }
      const items = Array.isArray(data?.items) ? data.items : [];
      const mapped = items
        .map((item: any) => {
          const id = item?.id?.videoId;
          const snippet = item?.snippet;
          if (!id || !snippet) return null;
          const thumb =
            snippet?.thumbnails?.medium?.url ||
            snippet?.thumbnails?.default?.url ||
            "";
          return {
            id,
            title: snippet.title ?? "Untitled",
            channelTitle: snippet.channelTitle ?? "",
            thumbnail: thumb,
            url: `https://www.youtube.com/watch?v=${id}`,
          } as YoutubeResult;
        })
        .filter(Boolean) as YoutubeResult[];
      setYtResults(mapped);
    } catch (err: any) {
      setYtError(err?.message || "Failed to fetch videos.");
    } finally {
      setYtLoading(false);
    }
  };

  return (
    <>
      <NavLinksClass
        isTeacher={isTeacher}
        classId={classId!}
        activeTab="Stream"
      />
      <div className="pt-6 px-75 flex flex-col">
        <div className="flex flex-col text-white justify-end h-64 rounded-3xl px-8 py-8 bg-linear-to-r from-[#000000]/70 to-[#000000]/20">
          <h1 className="font-bold text-4xl">Frontend</h1>
          <p>Section A • 2024-2025</p>
        </div>
        <div className="flex gap-6 mt-6">
          <div className="w-63.5">
            <div className="flex flex-col gap-4 border border-[#E2E8F0] p-5 rounded-lg">
              <h4 className="font-bold text-[14px] ">Upcoming Work</h4>
              <div>
                <p className="text-[#64748B] text-[12px]">
                  Due Friday, 11:59 PM
                </p>
                <h3 className="text-[14px]">Lab Report #4: Mitochondria</h3>
              </div>
              <div>
                <p className="text-[#64748B] text-[12px]">
                  Due Friday, 11:59 PM
                </p>
                <h3 className="text-[14px]">Lab Report #4: Mitochondria</h3>
              </div>
              <p className="text-[#137FEC] text-[12px] rounded-full hover:bg-[#137FEC]/10 w-max cursor-pointer px-3 py-2 justify-end">
                View all
              </p>
            </div>
            <div className="flex flex-col gap-4 border border-[#E2E8F0] p-5 rounded-lg mt-4">
              <h4 className="font-bold text-[14px] ">Class Code</h4>
              <div className="flex justify-between items-center">
                <h2 className="text-[#137FEC] font-medium text-[18px]">
                  {classroom.class_code}
                </h2>
                <Dialog>
                  <DialogTrigger asChild>
                    <div className="flex justify-center items-center w-8 h-8 cursor-pointer rounded-full hover:bg-[#94A3B8]/10">
                      <IoMdExpand className="text-[#94A3B8] " />
                    </div>
                  </DialogTrigger>
                  <DialogContent className="w-full max-w-175 ">
                    <DialogHeader>
                      <DialogTitle>Class code</DialogTitle>
                      <DialogDescription>
                        Share this code with students to join the class.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex items-center justify-center rounded-lg border bg-[#F8FAFC] py-6">
                      <span
                        className="text-8xl
                       font-semibold tracking-widest text-[#137FEC]"
                      >
                        {classroom.class_code}
                      </span>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
          <div className="flex-1">
            <Dialog open={postDialogOpen} onOpenChange={handlePostClose}>
              <DialogTrigger asChild>
                <div
                  className={`w-full p-4 flex gap-4 cursor-pointer border border-[#E2E8F0] rounded-lg justify-between overflow-hidden transition-all duration-300 h-18`}
                >
                  <div className="flex w-full items-center justify-between h-10">
                    <div className="flex gap-4 items-center">
                      <Avatar>
                        <AvatarImage
                          src="https://github.com/shadcn.png"
                          alt="@shadcn"
                          className="grayscale"
                        />
                        <AvatarFallback>CN</AvatarFallback>
                      </Avatar>
                      <h3 className="text-[#64748B]">
                        Share something with your class...
                      </h3>
                    </div>
                    <div className="w-8 h-8 flex justify-center items-center rounded-full cursor-pointer hover:bg-gray-200">
                      <MdOutlineEdit className="text-xl" />
                    </div>
                  </div>
                </div>
              </DialogTrigger>
              <DialogContent className="sm:max-w-180 p-0 overflow-hidden">
                <DialogHeader className="px-6 pt-5 pb-4 border-b border-[#E2E8F0] text-left">
                  <DialogTitle className="text-[16px] font-semibold text-[#0F172A]">
                    Post Announcement
                  </DialogTitle>
                  <DialogDescription className="sr-only">
                    Post an announcement to the class stream
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handlePostSubmit}>
                  <div className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <Avatar>
                        <AvatarImage
                          src="https://github.com/shadcn.png"
                          alt="@shadcn"
                          className="grayscale"
                        />
                        <AvatarFallback>CN</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-semibold text-[#0F172A]">
                          {isTeacher
                            ? `Dr. ${user?.profile.firstName ?? ""} ${user?.profile.lastName ?? ""}`.trim()
                            : `${user?.userName ?? ""} ${user?.userLastName ?? ""}`.trim()}
                        </p>
                        <p className="text-xs text-[#64748B]">
                          {classroom.subject} • Section {classroom.section}
                        </p>
                      </div>
                    </div>
                    <textarea
                      value={postForm.message}
                      onChange={(e) => handlePostChange(e.target.value)}
                      placeholder="Share something with your class..."
                      className="mt-4 min-h-48 w-full resize-none border-none bg-transparent p-0 text-sm text-[#0F172A] placeholder:text-[#CBD5E1] focus:outline-none"
                    />
                    {selectedYoutube && (
                      <div className="mt-4 flex items-center gap-3 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-3">
                        {selectedYoutube.thumbnail ? (
                          <img
                            src={selectedYoutube.thumbnail}
                            alt={selectedYoutube.title}
                            className="h-12 w-20 rounded object-cover"
                          />
                        ) : (
                          <div className="h-12 w-20 rounded bg-[#E2E8F0]" />
                        )}
                        <div className="flex-1">
                          <p className="text-sm font-medium text-[#0F172A] line-clamp-1">
                            {selectedYoutube.title}
                          </p>
                          <p className="text-xs text-[#64748B] line-clamp-1">
                            {selectedYoutube.channelTitle}
                          </p>
                          <a
                            href={selectedYoutube.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-[#2563EB]"
                          >
                            Open on YouTube
                          </a>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedYoutube(null)}
                          className="text-xs text-[#64748B] hover:text-[#0F172A]"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="px-6 pb-5">
                    <p className="text-[11px] tracking-wide text-[#94A3B8] uppercase mb-3">
                      Add to your post
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        className="cursor-pointer flex items-center gap-2 rounded-lg border border-[#E2E8F0] px-3 py-2 text-xs font-medium text-[#475569] hover:bg-[#F8FAFC]"
                      >
                        <Paperclip className="h-4 w-4 text-[#2563EB]" />
                        Upload file
                      </button>
                      <button
                        type="button"
                        onClick={handleGoogleDriveClick}
                        disabled={
                          !isGoogleConfigured || !pickerReady || !gisReady
                        }
                        className="cursor-pointer flex items-center gap-2 rounded-lg border border-[#E2E8F0] px-3 py-2 text-xs font-medium text-[#475569] hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Cloud className="h-4 w-4 text-[#16A34A]" />
                        Google Drive
                      </button>
                      <button
                        type="button"
                        onClick={handleYoutubeClick}
                        className="cursor-pointer flex items-center gap-2 rounded-lg border border-[#E2E8F0] px-3 py-2 text-xs font-medium text-[#475569] hover:bg-[#F8FAFC]"
                      >
                        <PlayCircle className="h-4 w-4 text-[#EF4444]" />
                        Youtube
                      </button>
                      <button
                        type="button"
                        className="cursor-pointer flex items-center gap-2 rounded-lg border border-[#E2E8F0] px-3 py-2 text-xs font-medium text-[#475569] hover:bg-[#F8FAFC]"
                      >
                        <Link2 className="h-4 w-4 text-[#2563EB]" />
                        Link
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-[#E2E8F0] bg-[#F8FAFC]">
                    <Button
                      type="button"
                      variant="ghost"
                      className="text-[#64748B]"
                      onClick={() => handlePostClose(false)}
                    >
                      Cancel
                    </Button>
                    <div className="flex">
                      <Button type="submit" className="rounded-r-none">
                        Post
                      </Button>
                      <Button
                        type="button"
                        className="rounded-l-none border-l border-white/20 px-2"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={ytOpen} onOpenChange={setYtOpen}>
              <DialogContent className="sm:max-w-160 p-0 overflow-hidden">
                <DialogHeader className="px-6 py-4 border-b border-[#E2E8F0] text-left">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#FF0000]">
                      <svg
                        viewBox="0 0 24 24"
                        className="h-4 w-4 fill-white"
                        aria-hidden="true"
                      >
                        <path d="M10 15.5v-7l6 3.5-6 3.5z" />
                      </svg>
                    </span>
                    <DialogTitle className="text-[16px] font-semibold text-[#0F172A]">
                      YouTube
                    </DialogTitle>
                  </div>
                  <DialogDescription className="sr-only">
                    Search YouTube or paste a URL
                  </DialogDescription>
                </DialogHeader>

                <div className="px-6 py-10">
                  <div className="flex flex-col items-center gap-6">
                    <div className="flex items-center gap-6">
                      <div className="h-14 w-10 rounded-md bg-[#E2E8F0]" />
                      <div className="relative h-16 w-40 rounded-lg border border-[#E2E8F0] bg-white">
                        <div className="absolute left-3 top-3 h-6 w-10 rounded bg-[#BFDBFE]" />
                        <div className="absolute left-3 top-10 h-2 w-24 rounded bg-[#E2E8F0]" />
                        <div className="absolute left-3 top-14 h-2 w-16 rounded bg-[#E2E8F0]" />
                        <div className="absolute right-3 top-6 h-4 w-4 rounded-full bg-[#FEF08A]" />
                      </div>
                    </div>

                    <div className="flex w-full max-w-xl items-center rounded-md border border-[#2563EB] bg-white px-3 py-2 shadow-[0_0_0_3px_rgba(37,99,235,0.08)]">
                      <input
                        value={ytQuery}
                        onChange={(e) => setYtQuery(e.target.value)}
                        placeholder="Search YouTube or paste a URL"
                        className="h-8 w-full border-none bg-transparent text-sm outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleYoutubeSearch}
                        disabled={ytLoading || !ytQuery.trim()}
                        className="ml-2 inline-flex h-8 w-8 items-center justify-center rounded-md text-[#94A3B8] hover:bg-[#F1F5F9] disabled:opacity-60"
                        aria-label="Search"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          className="h-4 w-4 fill-current"
                          aria-hidden="true"
                        >
                          <path d="M15.5 14h-.79l-.28-.27A6.5 6.5 0 1 0 14 15.5l.27.28v.79L20 21.5 21.5 20l-6-6zm-6 0A4.5 4.5 0 1 1 10 5a4.5 4.5 0 0 1-.5 9z" />
                        </svg>
                      </button>
                    </div>

                    {ytError && (
                      <p className="text-xs text-red-600">{ytError}</p>
                    )}

                    {ytResults.length > 0 && (
                      <div className="w-full max-w-2xl grid gap-2">
                        {ytResults.map((video) => (
                          <button
                            key={video.id}
                            type="button"
                            onClick={() => {
                              setSelectedYoutube(video);
                              setYtOpen(false);
                            }}
                            className="flex items-center gap-3 rounded-md border border-[#E2E8F0] p-2 text-left hover:bg-[#F8FAFC]"
                          >
                            {video.thumbnail ? (
                              <img
                                src={video.thumbnail}
                                alt={video.title}
                                className="h-12 w-20 rounded object-cover"
                              />
                            ) : (
                              <div className="h-12 w-20 rounded bg-[#E2E8F0]" />
                            )}
                            <div>
                              <p className="text-sm font-medium text-[#0F172A] line-clamp-1">
                                {video.title}
                              </p>
                              <p className="text-xs text-[#64748B] line-clamp-1">
                                {video.channelTitle}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </>
  );
};

export default Stream;
