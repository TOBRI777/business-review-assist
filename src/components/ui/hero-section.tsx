import { Star, TrendingUp, MessageSquare, Shield } from "lucide-react";
import { Button } from "./button";

export const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-glow opacity-30"></div>
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center max-w-4xl mx-auto animate-fade-in">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-primary/20 mb-8 animate-scale-in">
            <Star className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-text-secondary">
              Gestion intelligente des avis Google Business
            </span>
          </div>
          
          {/* Main heading */}
          <h1 className="text-5xl lg:text-7xl font-bold mb-6 leading-tight">
            Transformez vos{" "}
            <span className="gradient-text">avis clients</span>
            <br />
            en opportunités
          </h1>
          
          {/* Subheading */}
          <p className="text-xl lg:text-2xl text-text-muted mb-8 max-w-3xl mx-auto leading-relaxed">
            Connectez vos établissements Google Business Profile et laissez l'IA 
            générer des réponses personnalisées pour chaque avis, automatiquement.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button 
              size="lg" 
              className="text-lg px-8 py-4 glow animate-glow-pulse"
              onClick={() => window.location.href = '/auth/google'}
            >
              Connecter Google Business
            </Button>
          </div>
          
          {/* Features preview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto animate-slide-up">
            <div className="glass p-6 rounded-2xl border border-primary/10 hover:border-primary/20 transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center mb-4 mx-auto">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-text-primary mb-2">Multi-établissements</h3>
              <p className="text-text-muted text-sm">
                Gérez tous vos points de vente depuis une interface unique
              </p>
            </div>
            
            <div className="glass p-6 rounded-2xl border border-accent/10 hover:border-accent/20 transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center mb-4 mx-auto">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-text-primary mb-2">IA Personnalisée</h3>
              <p className="text-text-muted text-sm">
                Réponses adaptées au ton de votre marque avec OpenAI
              </p>
            </div>
            
            <div className="glass p-6 rounded-2xl border border-success/10 hover:border-success/20 transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center mb-4 mx-auto">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-text-primary mb-2">Validation</h3>
              <p className="text-text-muted text-sm">
                Approuvez ou automatisez vos réponses selon vos préférences
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};