import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface UserAvatarProps {
  src?: string | null;
  name?: string | null;
}

export function UserAvatar({ src, name }: UserAvatarProps) {
  const initial = name ? name.charAt(0).toUpperCase() : "S"; 

  return (
    <Avatar className="h-10 w-10 border border-border">
      <AvatarImage src={src || undefined} />
      <AvatarFallback className="bg-card text-muted-foreground font-medium">
        {initial}
      </AvatarFallback>
    </Avatar>
  );
}