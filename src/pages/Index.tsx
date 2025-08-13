import { Header } from "@/components/layout/Header";
import { HeroSection } from "@/components/ui/hero-section";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Button } from "@/components/ui/button";
import { 
  MessageSquare, 
  TrendingUp, 
  Users, 
  Star,
  Building2,
  Settings
} from "lucide-react";

const Index = () => {
  // Sample data for demonstration
  const stats = [
    {
      title: "Avis en attente",
      value: 12,
      description: "Nécessitent une réponse",
      icon: MessageSquare,
      trend: { value: 8, direction: "up" as const }
    },
    {
      title: "Note moyenne",
      value: "4.6",
      description: "Sur 5 étoiles",
      icon: Star,
      trend: { value: 2, direction: "up" as const }
    },
    {
      title: "Établissements",
      value: 3,
      description: "Connectés à Google",
      icon: Building2
    },
    {
      title: "Réponses automatiques",
      value: "89%",
      description: "Taux d'automatisation",
      icon: TrendingUp,
      trend: { value: 12, direction: "up" as const }
    }
  ];


  return (
    <div className="min-h-screen">
      <Header />
      
      {/* Main Content */}
      <main className="pt-16">
        {/* Hero Section */}
        <HeroSection />
        
        {/* Dashboard Preview */}
        <section className="py-20 bg-surface-secondary/30">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-text-primary mb-4">
                Tableau de bord en temps réel
              </h2>
              <p className="text-xl text-text-muted max-w-2xl mx-auto">
                Surveillez vos avis, analysez les tendances et optimisez votre réputation en ligne
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {stats.map((stat, index) => (
                <StatsCard
                  key={index}
                  title={stat.title}
                  value={stat.value}
                  description={stat.description}
                  icon={stat.icon}
                  trend={stat.trend}
                  className="animate-slide-up"
                  style={{ animationDelay: `${index * 100}ms` } as any}
                />
              ))}
            </div>

            {/* CTA Section */}
            <div className="text-center">
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => window.location.href = '/dashboard'}
              >
                Accéder au tableau de bord
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Index;
