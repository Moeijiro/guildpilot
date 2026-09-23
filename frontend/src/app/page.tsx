"use client";

import Link from "next/link";
import { ArrowRight, BarChart3, Eye, ListChecks, MousePointerClick, Route, ShieldCheck, Tags, UserPlus, Users } from "lucide-react";
import { Logo } from "@/components/brand";
import { DiscordPreview } from "@/components/discord-preview";
import { CtaBand, FeatureCard, Hero, HeroButton, HeroCard, InfoCard, Section, SiteFooter, SiteNav } from "@/components/kit/site";
import { Bar } from "@/components/kit/ui";
import { Button } from "@/components/ui/button";

const SAMPLE = {
  id: 0, flow_id: 0, step_order: 2, step_type: "button_choice" as const, created_at: "",
  title: "Choose your region", description: "Hey {{username}} — pick your region to unlock local channels and event alerts.",
  options: [{ key: "eu", label: "Europe", emoji: "🇪🇺", role_name: "Europe" }, { key: "na", label: "North America", emoji: "🌎", role_name: "North America" }, { key: "apac", label: "Asia-Pacific", emoji: "🌏", role_name: "APAC" }],
};

function Preview() {
  return (
    <HeroCard>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <DiscordPreview step={SAMPLE} total={5} serverName="Developer Nexus" username="alex" />
        <div className="space-y-4">
          <p className="text-sm font-semibold">Onboarding funnel</p>
          <Bar label="1. Welcome" value={48} max={50} hint="48 of 50" />
          <Bar label="2. Region" value={41} max={50} hint="41 of 50" />
          <Bar label="3. Interests" value={37} max={50} hint="37 of 50" />
          <Bar label="4. Rules" value={35} max={50} hint="35 of 50" tone="ok" />
        </div>
      </div>
    </HeroCard>
  );
}

export default function Landing() {
  return (
    <>
      <SiteNav brand={<Logo />} links={[["#how", "How it works"], ["#features", "Features"], ["#use-cases", "Use cases"]]}
        actions={<Button asChild size="sm"><Link href="/dashboard">Open the demo</Link></Button>} />
      <main id="main">
        <Hero eyebrow="Discord onboarding"
          title="Turn new members into regulars in five clicks."
          description="GuildPilot walks every new member through a short flow in Discord — welcome, region, interests, rules — and gives them the right roles from their answers. You see where people drop off."
          actions={<><HeroButton href="/dashboard">Open the dashboard<ArrowRight data-icon="inline-end" /></HeroButton><HeroButton href="#how" variant="outline">How it works</HeroButton></>}
          note="The demo server has a five-step flow and members at every stage."
          visual={<Preview />} />

        <Section id="how" eyebrow="How it works" title="A guided first five minutes">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <FeatureCard icon={UserPlus} title="Someone joins" index={1}>The bot greets them privately with the first step of your flow.</FeatureCard>
            <FeatureCard icon={MousePointerClick} title="They answer" index={2} delay={0.05}>Buttons and menus: region, interests, a rules check — one step at a time.</FeatureCard>
            <FeatureCard icon={Tags} title="Roles follow answers" index={3} delay={0.1}>Each option can grant a role, so the right channels open up.</FeatureCard>
            <FeatureCard icon={ShieldCheck} title="Finished = verified" index={4} delay={0.15}>Completing the flow grants the member role for the rest of the server.</FeatureCard>
          </div>
        </Section>

        <Section id="features" eyebrow="For server admins" title="Build it, preview it, measure it" tinted>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard icon={Route} title="Flow builder">Add, edit, reorder and delete steps; the order is kept gap-free.</FeatureCard>
            <FeatureCard icon={Eye} title="Live Discord preview" delay={0.05}>See each step exactly as a member will, with their name filled in.</FeatureCard>
            <FeatureCard icon={BarChart3} title="Drop-off funnel" delay={0.1}>How many members got past each step, and how long finishing takes.</FeatureCard>
            <FeatureCard icon={Users} title="Member progress">Every member&apos;s step, answers and roles — reset anyone to start again.</FeatureCard>
            <FeatureCard icon={ListChecks} title="One step at a time" delay={0.05}>Members can only answer the step they&apos;re on, with an option it offers.</FeatureCard>
            <FeatureCard icon={ShieldCheck} title="Scoped to your server" delay={0.1}>Steps can&apos;t be edited through another server&apos;s address.</FeatureCard>
          </div>
        </Section>

        <Section id="use-cases" eyebrow="Use cases" title="For communities that grow every day" last>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <InfoCard title="Developer communities">Route people to the language and framework channels they care about.</InfoCard>
            <InfoCard title="Game servers" delay={0.05}>Region and platform roles so players find matches in their timezone.</InfoCard>
            <InfoCard title="Creator communities">Rules first, then perks — a clean start for every new subscriber.</InfoCard>
            <InfoCard title="Course and cohort servers" delay={0.05}>Cohort and track roles that unlock the right study channels.</InfoCard>
          </div>
          <CtaBand title="Walk a member through the flow" description="Open the Members page and press Next step — watch the roles and the funnel update."
            action={<Button asChild size="lg" variant="secondary" className="h-11 px-5"><Link href="/dashboard">Open the demo<ArrowRight data-icon="inline-end" /></Link></Button>} />
        </Section>
      </main>
      <SiteFooter brand={<Logo />} right={<><ShieldCheck className="size-3.5" />Roles only from the options you define</>} />
    </>
  );
}
