"use client";

import { useInView } from "@/hooks/use-in-view";
import { Bookmark, Clock, DollarSign } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export default function FeaturedEvent() {
  const { ref, inView } = useInView();

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8">
      <div
        ref={ref}
        className={`max-w-7xl mx-auto animate-on-scroll ${
          inView ? "visible" : ""
        }`}
      >
        <h2 className="text-3xl font-bold mb-8">Featured Crowdfund Event</h2>

        <div className="glassmorphism rounded-xl overflow-hidden">
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mr-4">
                  <span className="text-red-500 text-2xl">+</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold">Healthcare Funding</h3>
                  <p className="text-gray-700">
                    This healthcare funding event is aimed at helping kids in
                    Africa suffering polio and who do not have access to
                    vaccination.
                  </p>
                </div>
              </div>
              <button className="text-gray-400 hover:text-gray-600">
                <Bookmark className="h-6 w-6" />
              </button>
            </div>

            <div className="relative w-full h-[300px] rounded-lg overflow-hidden mb-4">
              <Image
                src="/healthcare.jpg"
                alt="Healthcare funding"
                fill
                className="object-cover"
              />
            </div>

            <div className="flex justify-between items-center">
              <div className="flex items-center text-sm text-gray-600">
                <Clock className="h-4 w-4 mr-1" />
                <span>Posted 3 days ago</span>
              </div>

              <div className="flex items-center">
                <div className="mr-4">
                  <div className="progress-bar w-40">
                    <div
                      className="progress-bar-fill"
                      style={{ width: `60%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    60% completed
                  </div>
                </div>

                <Button className="rounded-full bg-black text-white hover:bg-gray-800">
                  <DollarSign className="h-4 w-4 mr-1" />
                  Donate Now
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
