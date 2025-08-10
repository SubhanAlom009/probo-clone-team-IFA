export default function Footer() {
  return (
    <section id="footer" className="bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        {/* Top branding row */}
       

        {/* Links row */}
        <div className="flex flex-wrap justify-between border-t border-b border-gray-200 py-6 gap-y-6">
          {/* Company */}
          <div className="w-1/2 sm:w-1/4 md:w-auto">
            <h3 className="font-semibold text-gray-800 mb-3">Company</h3>
            <nav className="flex flex-col space-y-2 text-gray-700 text-sm">
              <a href="/about-us" className="hover:underline">About Us</a>
              <a href="/culture" className="hover:underline">Culture</a>
            </nav>
          </div>

          {/* Resources */}
          <div className="w-1/2 sm:w-1/4 md:w-auto">
            <h3 className="font-semibold text-gray-800 mb-3">Resources</h3>
            <nav className="flex flex-col space-y-2 text-gray-700 text-sm">
              <a href="/support" className="hover:underline">Help Centre</a>
              <a href="/events#" className="hover:underline">Contact Support</a>
              <a href="https://medium.com/probo-headquarters" target="_blank" rel="noopener noreferrer" className="hover:underline">
                What's New
              </a>
            </nav>
          </div>

          {/* Careers */}
          <div className="w-1/2 sm:w-1/4 md:w-auto">
            <h3 className="font-semibold text-gray-800 mb-3">Careers</h3>
            <nav className="flex flex-col space-y-2 text-gray-700 text-sm">
              <a href="/careers" className="hover:underline">Open Roles</a>
            </nav>
          </div>

          {/* Contact Us */}
          <div className="w-1/2 sm:w-1/4 md:w-auto">
            <h3 className="font-semibold text-gray-800 mb-3">Contact Us</h3>
            <nav className="flex flex-col space-y-2 text-gray-700 text-sm">
              <a href="mailto:help@probo.in" className="hover:underline">help@probo.in</a>
              <a href="mailto:communication@probo.in" className="hover:underline">communication@probo.in</a>
            </nav>
          </div>
        </div>

        {/* Partnerships row */}
        <div className="flex flex-wrap justify-between items-center border-b border-gray-200 py-6 gap-y-6">
          <div className="max-w-3xl text-gray-700 text-sm">
            <h3 className="font-semibold mb-2">Probo Partnerships</h3>
            <p>
              Probo’s experience is made possible by our partnerships with <b>Authbridge</b> for verification technology, <b>DataMuni</b> for data & analytics, <b>Google Firebase</b>, <b>Google Cloud</b> & <b>AWS</b>. Probo is also a member of <b>FICCI</b> and <b>ASSOCHAM</b>.
            </p>
          </div>

          <div className="flex flex-wrap gap-4">
            {/* Payment/partner icons */}
            {[
              { src: "https://d39axbyagw7ipf.cloudfront.net/images/footer/trading-view.webp", alt: "Trading View" },
              { src: "https://d39axbyagw7ipf.cloudfront.net/images/footer/authbridge.webp", alt: "Auth Bridge" },
              { src: "https://d39axbyagw7ipf.cloudfront.net/images/footer/datamuni.webp", alt: "Datamuni" },
              { src: "https://d39axbyagw7ipf.cloudfront.net/images/footer/google-cloud.webp", alt: "Google Cloud" },
              { src: "https://d39axbyagw7ipf.cloudfront.net/images/footer/google-firebase.webp", alt: "Google Firebase" },
            ].map(({ src, alt }) => (
              <div key={alt} className="w-12 h-12 relative ">
                <img src={src} alt={alt} title={alt} className="object-contain w-full h-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Social & copyright */}
        <div className="flex flex-wrap justify-between items-center py-6 border-b border-gray-200 gap-y-6">
          <div className="flex space-x-8">
            {/* Social links */}
            {[
              { href: "https://www.linkedin.com/company/probomedia/mycompany/", alt: "LinkedIn", icon: "https://d39axbyagw7ipf.cloudfront.net/images/footer/linkedin.webp" },
              { href: "https://twitter.com/probo_india", alt: "Twitter", icon: "https://d39axbyagw7ipf.cloudfront.net/images/footer/x.webp" },
              { href: "https://www.instagram.com/probo_india/", alt: "Instagram", icon: "https://d39axbyagw7ipf.cloudfront.net/images/footer/instagram.webp" },
              { href: "https://www.youtube.com/c/Probo_India", alt: "Youtube", icon: "https://d39axbyagw7ipf.cloudfront.net/images/footer/youtube.webp" },
            ].map(({ href, alt, icon }) => (
              <a
                key={alt}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center text-gray-700 hover:text-gray-900 text-sm"
              >
                <img src={icon} alt={alt} title={alt} className="w-10 h-10 object-contain mb-1" />
                <span>{alt}</span>
              </a>
            ))}
          </div>

          <div className="text-sm text-gray-600">
            <div className="flex space-x-4 mb-2">
              <a href="/terms-and-conditions" className="hover:underline">Terms and Conditions</a>
              <a href="/privacy-policy" className="hover:underline">Privacy Policy</a>
              <a href="/legality" className="hover:underline">Legality</a>
            </div>
            <div>© copyright 2025 by Probo Media Technologies Pvt. Ltd.</div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="py-6 text-xs text-gray-500">
          <span className="font-semibold">Disclaimer</span>
          <span> This game may be habit forming or financially risky. Play responsibly. 18+ only.</span>
        </div>
      </div>
    </section>
  );
}
