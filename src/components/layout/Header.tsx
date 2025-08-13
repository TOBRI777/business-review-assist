import { Button } from "@/components/ui/button";
import { Building2, Menu, Settings, User } from "lucide-react";
import { useState } from "react";

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-primary/10">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-text-primary">
                Business Review Assist
              </h1>
              <p className="text-xs text-text-muted -mt-1">
                Gestion intelligente des avis
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-2">
            <Button variant="ghost" size="sm">
              Dashboard
            </Button>
            <Button variant="ghost" size="sm">
              Établissements
            </Button>
            <Button variant="ghost" size="sm">
              Réponses IA
            </Button>
            <Button variant="ghost" size="sm">
              Paramètres
            </Button>
          </nav>

          {/* User Actions */}
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="hidden md:flex">
              <Settings className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="hidden md:flex">
              <User className="w-4 h-4" />
            </Button>
            <Button 
              variant="glass" 
              size="sm"
              className="hidden md:flex"
            >
              Connecter Google
            </Button>
            
            {/* Mobile menu button */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <Menu className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-primary/10 py-4 animate-slide-up">
            <nav className="flex flex-col gap-2">
              <Button variant="ghost" size="sm" className="justify-start">
                Dashboard
              </Button>
              <Button variant="ghost" size="sm" className="justify-start">
                Établissements
              </Button>
              <Button variant="ghost" size="sm" className="justify-start">
                Réponses IA
              </Button>
              <Button variant="ghost" size="sm" className="justify-start">
                Paramètres
              </Button>
              <hr className="border-primary/10 my-2" />
              <Button variant="glass" size="sm">
                Connecter Google
              </Button>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};