export default function StoresPage() {
  const stores = [
    {
      id: 1,
      name: 'Downtown Flagship',
      address: '123 Commerce St, New York, NY 10001',
      phone: '+1-212-555-0199',
      email: 'downtown@ecom-os.local',
      hours: 'Mon-Sat: 10AM - 8PM | Sun: 11AM - 6PM',
    },
    {
      id: 2,
      name: 'Westside Boutique',
      address: '456 West Ave, Los Angeles, CA 90048',
      phone: '+1-323-555-0144',
      email: 'westside@ecom-os.local',
      hours: 'Mon-Sun: 10AM - 9PM',
    }
  ];

  return (
    <main className="max-w-4xl mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold mb-4">Our Stores</h1>
      <p className="text-secondary mb-12">Find a store near you or contact us directly.</p>

      <div className="grid gap-8 md:grid-cols-2">
        {stores.map(store => (
          <div key={store.id} className="border border-foreground/10 rounded-xl p-6 bg-card">
            <h2 className="text-2xl font-semibold mb-2">{store.name}</h2>
            <p className="text-foreground/80 mb-4">{store.address}</p>
            <div className="space-y-2 text-sm">
              <p>
                <span className="font-medium">Phone:</span>{' '}
                <a href={`tel:${store.phone}`} className="text-blue-600 hover:underline">{store.phone}</a>
              </p>
              <p>
                <span className="font-medium">Email:</span>{' '}
                <a href={`mailto:${store.email}`} className="text-blue-600 hover:underline">{store.email}</a>
              </p>
              <p>
                <span className="font-medium">Hours:</span> {store.hours}
              </p>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
