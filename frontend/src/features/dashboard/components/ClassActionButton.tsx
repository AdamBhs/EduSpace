import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import JoinClassDialog from "./JoinClassDialog";
import TermsDialog from "./TermsDialog";
import CreateClassDialog from "./CreateClassDialog";

const ClassActionButton = () => {
  const [joinOpen, setJoinOpen] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const handleCreateClick = () => {
    setTermsOpen(true);
  };

  const handleTermsAccepted = () => {
    setTermsOpen(false);
    setCreateOpen(true);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="icon-lg"
            className="fixed cursor-pointer bottom-8 right-8 z-40 size-12 rounded-full bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-xl transition-all"
          >
            <Plus className="size-6" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="top" className="w-40 mb-2">
          <DropdownMenuItem
            onClick={() => setJoinOpen(true)}
            className="cursor-pointer"
          >
            Join class
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleCreateClick}
            className="cursor-pointer text-blue-500"
          >
            Create class
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <JoinClassDialog open={joinOpen} onOpenChange={setJoinOpen} />
      <TermsDialog
        open={termsOpen}
        onOpenChange={setTermsOpen}
        onAccept={handleTermsAccepted}
      />
      <CreateClassDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
};

export default ClassActionButton;
