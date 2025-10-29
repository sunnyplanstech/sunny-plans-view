const DemoSection = () => {
  return (
    <section id="demo" className="py-16 md:py-24 bg-background">
      <div className="container px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-text bg-clip-text text-transparent">
              See Our Platform in Action
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Explore real land data and substation proximity analysis. This interactive demo shows exactly how we help you find the perfect site for your renewable energy projects.
            </p>
          </div>

          {/* Airtable Embed */}
          <div className="relative rounded-lg overflow-hidden shadow-elegant border border-border bg-card">
            <iframe 
              className="airtable-embed w-full" 
              src="https://airtable.com/embed/appEnruPZFFkSJ1SJ/shrCptFwjfjpa2Vu8" 
              frameBorder="0" 
              width="100%" 
              height="533" 
              style={{ background: 'transparent' }}
            />
          </div>

          {/* Call-to-action below demo */}
          <div className="text-center mt-8">
            <p className="text-sm text-muted-foreground">
              Want access to the full platform with nationwide data? 
              <a href="#signup" className="text-primary hover:underline ml-1 font-medium">
                Start your free search
              </a>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DemoSection;
