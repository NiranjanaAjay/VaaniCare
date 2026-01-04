import { useNavigate } from "react-router-dom";
import {
  Heart,
  ShieldAlert,
  Landmark,
  Mic,
  ArrowRight,
  Activity,
  Scale,
  Briefcase,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface ServiceButton {
  id: string;
  icon: LucideIcon;
  label: string;
  labelMalayalam: string;
  description: string;
  route: string;
}

const services: ServiceButton[] = [
  {
    id: "healthcare",
    icon: Heart,
    label: "Healthcare",
    labelMalayalam: "ആരോഗ്യ സേവനം",
    description: "Find doctors, hospitals & health guidance",
    route: "/conversation/healthcare",
  },
  {
    id: "emergency",
    icon: ShieldAlert,
    label: "Emergency",
    labelMalayalam: "അടിയന്തര സഹായം",
    description: "Quick access to emergency services",
    route: "/conversation/emergency",
  },
  {
    id: "legal",
    icon: Scale,
    label: "Legal Aid",
    labelMalayalam: "നിയമ സഹായം",
    description: "Legal support, NGOs & guidance",
    route: "/conversation/legal",
  },
  {
    id: "government",
    icon: Landmark,
    label: "Government",
    labelMalayalam: "സർക്കാർ പദ്ധതികൾ",
    description: "Explore schemes & benefits for you",
    route: "/conversation/government",
  },
  {
    id: "employment",
    icon: Briefcase,
    label: "Employment",
    labelMalayalam: "തൊഴിൽ സഹായം",
    description: "Find jobs & career opportunities",
    route: "/conversation/employment",
  },
];

export default function HomePage() {
  const navigate = useNavigate();

  const handleServiceClick = (service: ServiceButton) => {
    navigate(service.route);
  };

  return (
    <div className="min-h-screen bg-[#0B1624] relative overflow-hidden">
      {/* Organic Background Effects */}
      <div className="absolute inset-0">
        {/* Soft gradient orbs */}
        <div className="absolute top-[-18%] left-[-8%] w-[460px] h-[460px] bg-[#2FB7B3]/10 rounded-full blur-[90px] animate-breathe" />
        <div
          className="absolute bottom-[-18%] right-[-8%] w-[360px] h-[360px] bg-[#6FE3D6]/8 rounded-full blur-[110px] animate-breathe"
          style={{ animationDelay: "2s" }}
        />
        <div className="absolute top-[38%] right-[18%] w-[240px] h-[240px] bg-[#F2A24B]/6 rounded-full blur-[70px] animate-pulse-soft" />
      </div>

      {/* Subtle grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(47,183,179,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(47,183,179,0.03)_1px,transparent_1px)] bg-[size:52px_52px]" />

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-5 py-10">
        {/* Header Section */}
        <header className="text-center mb-12 max-w-3xl">
          {/* Pulse indicator */}
          <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-[#132238]/80 border border-[#2FB7B3]/20 mb-7 backdrop-blur-sm">
            <Activity className="w-4 h-4 text-[#6FE3D6]" />
            <span className="text-sm text-[#6FE3D6]/80 font-medium tracking-wide">
              Voice-First Care
            </span>
            <div className="w-2 h-2 rounded-full bg-[#6FE3D6] animate-pulse" />
          </div>

          {/* Logo with soft glow */}
          <div className="mb-7 relative">
            <div className="absolute inset-0 w-24 h-24 md:w-32 md:h-32 mx-auto bg-[#2FB7B3]/20 rounded-3xl blur-2xl animate-breathe" />
            <img
              src="/icons/logo.png"
              alt="VaaniCare Logo"
              className="relative w-24 h-24 md:w-32 md:h-32 mx-auto rounded-3xl shadow-2xl"
            />
          </div>

          {/* Title with gradient */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 tracking-tight leading-tight">
            <span className="text-gradient-vital">VaaniCare</span>
          </h1>

          {/* Tagline */}
          <p className="text-lg md:text-xl text-[#6FE3D6]/70 font-semibold mb-1">
            Your Voice, Your Care
          </p>
          <p className="text-sm md:text-base text-[#6FE3D6]/45">
            നിങ്ങളുടെ ശബ്ദം, നിങ്ങളുടെ പരിചരണം
          </p>
        </header>

        {/* Service Cards Grid */}
        <main className="w-full max-w-4xl px-2 sm:px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {services.map((service, index) => {
              const Icon = service.icon;
              return (
                <button
                  key={service.id}
                  onClick={() => handleServiceClick(service)}
                  className="group relative bg-[#132238]/70 backdrop-blur-sm border border-[#2FB7B3]/12 hover:border-[#2FB7B3]/30 rounded-3xl p-6 md:p-7 transition-all duration-400 ease-out hover:bg-[#132238]/85 focus:outline-none focus:ring-2 focus:ring-[#2FB7B3]/40 active:scale-[0.99]"
                  aria-label={`${service.label} - ${service.labelMalayalam}`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {/* Hover glow */}
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-[#2FB7B3]/0 via-[#6FE3D6]/0 to-[#F2A24B]/0 group-hover:from-[#2FB7B3]/5 group-hover:via-[#6FE3D6]/5 group-hover:to-[#F2A24B]/5 transition-all duration-500" />

                  {/* Icon with organic border */}
                  <div className="relative w-14 h-14 mx-auto mb-4 md:mb-5">
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#2FB7B3] via-[#6FE3D6] to-[#A8E6A1] opacity-20 group-hover:opacity-40 transition-opacity duration-500" />
                    <div className="absolute inset-[2px] rounded-2xl bg-[#0B1624] flex items-center justify-center">
                      <Icon
                        className="w-6 h-6 md:w-7 md:h-7 text-[#6FE3D6] group-hover:text-[#A8E6A1] transition-colors duration-300"
                        strokeWidth={1.5}
                      />
                    </div>
                  </div>

                  {/* Labels */}
                  <h2 className="text-lg md:text-xl font-semibold text-white/90 mb-0.5 text-center group-hover:text-white transition-colors leading-tight">
                    {service.label}
                  </h2>
                  <p className="text-xs md:text-sm text-[#6FE3D6]/55 mb-2 text-center leading-snug">
                    {service.labelMalayalam}
                  </p>
                  <p className="text-sm text-white/45 text-center mb-4 leading-relaxed">
                    {service.description}
                  </p>

                  {/* CTA */}
                  <div className="flex items-center justify-center gap-2 text-[#2FB7B3]/70 group-hover:text-[#F2A24B] transition-colors duration-300">
                    <span className="text-xs md:text-sm font-semibold tracking-wide">
                      Start
                    </span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                  </div>
                </button>
              );
            })}
          </div>
        </main>

        {/* Footer */}
        <footer className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#132238]/50 border border-[#2FB7B3]/15">
            <Mic className="w-4 h-4 text-[#F2A24B]" />
            <p className="text-white/45 text-xs md:text-sm">
              Tap to begin your voice journey
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
