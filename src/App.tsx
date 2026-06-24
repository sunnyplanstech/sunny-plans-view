// Sunnyplans is switched off. The whole SPA is replaced by this single
// static notice — no router, no providers, no API calls. To bring the
// product back, restore the previous App.tsx from git history.
const CONTACT_EMAIL = "eracle@posteo.eu";

const App = () => (
  <div className="min-h-screen flex items-center justify-center bg-background px-4 py-16">
    <main className="max-w-xl text-center">
      <h1 className="text-3xl font-bold mb-6">SunnyPlans is closed</h1>
      <p className="text-muted-foreground mb-4">
        SunnyPlans helped developers find substation-ready land for solar and
        battery-storage (BESS) projects — scoring parcels by grid proximity,
        solar potential, and terrain with a proprietary SunnyScore™ rating.
      </p>
      <p className="text-muted-foreground mb-8">
        I&apos;ve decided to switch it off, so the data and search are no longer
        available. Thanks to everyone who tried it.
      </p>
      <p className="text-muted-foreground">
        Questions?{" "}
        <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline">
          {CONTACT_EMAIL}
        </a>
      </p>
    </main>
  </div>
);

export default App;
