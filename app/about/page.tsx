import React from 'react';
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-12 max-w-3xl">
        <article>
          <h1 className="text-4xl md:text-5xl font-bold mb-8 text-center text-sui-navy">Exploring SuiGives</h1>

          {/* Image Placeholder */}
          <div className="my-8 text-center text-gray-500 italic">[Image Placeholder: Illustration related to SuiGives]</div>
          
          <section className="mb-10">
            <p className="text-lg text-gray-700 leading-relaxed mb-4">
              Have you ever had a brilliant idea for a project or cause, but felt overwhelmed by the complexities and limitations of traditional fundraising? Or perhaps you're a passionate supporter, eager to back innovative ventures but wary of opaque platforms and hidden fees. If so, you're not alone. The world of crowdfunding, while powerful, has long been hampered by systemic challenges that can stifle creativity and erode trust.
            </p>
            <p className="text-lg text-gray-700 leading-relaxed mb-4">
              Enter SuiGives – a platform born from the belief that supporting groundbreaking ideas should be transparent, secure, and community-centric. We're not just building another crowdfunding site; we're leveraging the revolutionary power of Web3 technology and the robust Sui blockchain to create an entirely new paradigm for bringing projects to life.
            </p>
            <p className="text-lg text-gray-700 leading-relaxed">
              Our journey began in 2023 with a clear vision: to directly connect creators and changemakers with a global community of supporters who resonate with their mission. We wanted to build a space where every contribution feels meaningful and where the process of giving and receiving is built on a foundation of integrity and efficiency. To date, we're incredibly proud to have helped fund over 200 diverse projects, demonstrating the real-world impact achievable when technology meets purpose.
            </p>
          </section>

          {/* Placeholder for Image: Introduce the core concept visually */}
          {/* <div className="my-12 text-center">[Image: Illustrating Connection/Empowerment]</div> */}

          <section className="mb-10">
            <h2 className="text-3xl font-semibold mb-6 text-sui-navy">The Blockchain Advantage: Transparency and Trust</h2>
            <p className="text-lg text-gray-700 leading-relaxed mb-4 mt-4">
              What truly sets SuiGives apart is our deep integration with the Sui blockchain. Forget centralized databases where information can be controlled or altered by a single entity. SuiGives operates on a decentralized, immutable ledger, providing a level of transparency and security that traditional platforms simply cannot match.
            </p>
            <ul className="list-disc list-inside text-lg text-gray-700 leading-relaxed mb-4 ml-4">
              <li><strong>Crystal-Clear Transparency:</strong> Every transaction, every donation, and the progress of each campaign is recorded on the immutable Sui ledger. This means anyone can verify the flow of funds and track a project's progress in real-time, fostering complete transparency and eliminating doubts about where contributions are going.</li>
              <li><strong>Enhanced Security:</strong> Blockchain technology provides a level of security simply unattainable by traditional systems. Cryptographic security protects transactions, and the decentralized nature of the network makes it highly resistant to fraud and tampering. Fundraisers and donors can interact with confidence, knowing their contributions and data are secure.</li>
              <li><strong>Reduced Costs:</strong> By removing intermediaries, SuiGives significantly reduces the fees typically associated with online transactions and fundraising platforms. More of the donated funds go directly to the projects that need them most, maximizing the impact of every contribution.</li>
              <li><strong>Global Accessibility:</strong> Sui is a global network, meaning SuiGives is accessible to anyone, anywhere in the world, with a compatible wallet. This breaks down geographical barriers that often limit traditional fundraising efforts and opens up projects to a wider pool of potential supporters.</li>
              <li><strong>Smart Contract Automation:</strong> Utilizing Sui's smart contract capabilities, key aspects of the crowdfunding process, such as fund distribution upon reaching a goal or handling project milestones, can be automated. This ensures fairness and efficiency, reducing administrative overhead and potential for disputes.</li>
            </ul>
            <p className="text-lg text-gray-700 leading-relaxed mt-4">
              This isn't just about using a trendy technology; it's about building a fundamentally more trustworthy and efficient system for bringing good ideas to life. The Sui blockchain is the engine driving this change, providing a foundation of transparency and security that empowers our entire community.
            </p>
          </section>

          {/* Placeholder for Image: Illustrate Blockchain/Transparency */}
          {/* <div className="my-12 text-center">[Image: Representing Decentralization/Security]</div> */}

          <section className="mb-10">
            <h2 className="text-3xl font-semibold mb-6 text-sui-navy">More Than Just Funding: Building a Community</h2>
            <p className="text-lg text-gray-700 leading-relaxed mb-4 mt-4">
              SuiGives is built for you – the passionate creator and the generous supporter. We've designed our platform to be as intuitive as possible, making it easy for creators to share their vision, launch campaigns, and keep their backers updated on progress. We provide the tools you need to focus on what truly matters: building your project and connecting with your audience.
            </p>
            <p className="text-lg text-gray-700 leading-relaxed mb-4">
              For supporters, discovering and backing projects is a seamless experience. You can explore a diverse range of campaigns, contribute securely using Sui network tokens, and easily track how your donation is making a difference directly on the blockchain. This level of engagement fosters a deeper connection between backers and the projects they support.
            </p>
             <p className="text-lg text-gray-700 leading-relaxed">
              But SuiGives is more than a transaction platform; it's a growing community. We aim to be the bridge that connects innovative minds with a global network of individuals who believe in their potential. This interaction and shared purpose are vital ingredients in the recipe for successful crowdfunding and lasting impact.
            </p>
          </section>

          {/* Placeholder for Image: Illustrate Community/Interaction */}
          {/* <div className="my-12 text-center">[Image: Depicting Community Support]</div> */}

           <section className="mb-10">
            <h2 className="text-3xl font-semibold mb-6 text-sui-navy">Breaking Down Barriers, Amplifying Impact</h2>
            <p className="text-lg text-gray-700 leading-relaxed mb-4 mt-4">
              The traditional crowdfunding landscape often presents hurdles that can be discouraging. High fees can significantly reduce the funds available to creators, and geographical limitations can prevent potentially impactful projects from reaching a global audience. SuiGives is built to dismantle these barriers.
            </p>
            <p className="text-lg text-gray-700 leading-relaxed mb-4">
              Our blockchain-based approach inherently lowers operational costs, allowing us to offer a more favorable fee structure. This means more of the funds raised stay with the creators, directly fueling their work. Furthermore, the borderless nature of the Sui blockchain opens up participation to anyone, anywhere, fostering a truly inclusive crowdfunding environment.
            </p>
             <p className="text-lg text-gray-700 leading-relaxed">
              The efficiency of blockchain transactions can also streamline the process of accessing funds, potentially speeding up the time it takes for creators to receive the resources they need to move forward. We are committed to creating a platform that is not only powerful but also accessible and efficient for everyone involved, regardless of their location or background.
            </p>
          </section>

          {/* Placeholder for Image: Illustrate Overcoming Barriers */}
          {/* <div className="my-12 text-center">[Image: Showing Global Reach/Accessibility]</div> */}

          <section>
            <h2 className="text-3xl font-semibold mb-6 text-sui-navy">Join Us in Building the Future of Giving</h2>
            <p className="text-lg text-gray-700 leading-relaxed mb-4 mt-4">
              SuiGives is more than just a platform; it's a movement towards a more decentralized, transparent, and empowered future for crowdfunding. We believe that by harnessing the power of Web3, we can unlock new potential for innovation and positive change around the globe.
            </p>
             <p className="text-lg text-gray-700 leading-relaxed mb-4">
              Whether you have a world-changing idea, a desire to support meaningful causes, or are simply curious about how Web3 is transforming finance and community, we invite you to explore SuiGives. Discover projects that resonate with you, learn how easy it is to launch your own campaign, and become a part of a community dedicated to making a real impact.
            </p>
            <p className="text-lg text-gray-700 leading-relaxed">
              SuiGives is more than just a platform; it's a movement towards a more decentralized, transparent, and empowering way to bring ideas to life. We are excited about the potential of the Sui blockchain to transform crowdfunding and look forward to building this future together with you.
            </p>
          </section>

           {/* Placeholder for Image: Call to Action / Future Vision */}
          {/* <div className="my-12 text-center">[Image: Vision for the Future of Crowdfunding]</div> */}

        </article>
      </main>
      <Footer />
    </div>
  );
} 