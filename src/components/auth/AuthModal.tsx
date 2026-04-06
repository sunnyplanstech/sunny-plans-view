import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import LoginForm from "./LoginForm";
import SignupForm from "./SignupForm";

export default function AuthModal() {
  const { authModalOpen, authModalTab, closeAuthModal, openAuthModal } = useAuth();

  return (
    <Dialog open={authModalOpen} onOpenChange={(open) => !open && closeAuthModal()}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">
            Welcome to Sunnyplans
          </DialogTitle>
        </DialogHeader>
        <Tabs
          value={authModalTab}
          onValueChange={(v) => openAuthModal(v as "login" | "signup")}
          className="mt-2"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Log In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          <TabsContent value="login" className="mt-4">
            <LoginForm />
          </TabsContent>
          <TabsContent value="signup" className="mt-4">
            <SignupForm />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
