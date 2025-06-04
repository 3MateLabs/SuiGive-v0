"use client"

import { ArrowRight, CheckCircle } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import AnimationWrapper from "./animation-wrapper"
import { useSuiCampaigns } from "@/hooks/useSuiCampaigns"
import { useEffect } from "react"

export default function CompletedCrowdfunds() {
  const { campaigns, loading, error, refreshCampaigns } = useSuiCampaigns();

  useEffect(() => {
    refreshCampaigns();
  }, [refreshCampaigns]);

  // Calculate progress percentage
  const calculateProgress = (current: string | undefined, goal: string | undefined): number => {
    if (!current || !goal) return 0;
    
    const currentNum = parseInt(current, 10);
    const goalNum = parseInt(goal, 10);
    
    if (isNaN(currentNum) || isNaN(goalNum) || goalNum === 0) {
      return 0;
    }
    
    return Math.round((currentNum / goalNum) * 100);
  };

  // Format SUI amount with commas
  const formatSuiAmount = (amount: string) => {
    if (!amount) return '0';
    try {
      // Convert from MIST to SUI (1 SUI = 10^9 MIST)
      const suiAmount = parseInt(amount, 10) / 1000000000;
      return suiAmount.toLocaleString(undefined, { maximumFractionDigits: 2 });
    } catch (e) {
      return '0';
    }
  };

  // Filter campaigns that have reached 100% or more
  const completedProjects = campaigns.filter(campaign => {
    const progress = calculateProgress(campaign.currentAmount, campaign.goalAmount);
    return progress >= 100;
  }).slice(0, 3); // Show only first 3 completed campaigns

  return (
    <section id="completed-crowdfunds" className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-everett font-bold sui-navy-text">Completed Crowdfunds</h2>
          <Link href="/explore" className="flex items-center text-sm font-medium sui-navy-text">
            View all projects <ArrowRight className="ml-1 h-4 w-4 arrow-bounce" />
          </Link>
        </div>

        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sui-navy"></div>
          </div>
        )}

        {!loading && completedProjects.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No completed campaigns yet.</p>
          </div>
        )}

        {!loading && completedProjects.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {completedProjects.map((project, index) => {
              const progress = calculateProgress(project.currentAmount, project.goalAmount);
              
              return (
                <AnimationWrapper
                  key={project.id}
                  id="completed-crowdfunds"
                  className="bg-white rounded-lg overflow-hidden border shadow-sm"
                  animationClass="panel-slide-in"
                  delay={index * 0.2}
                >
                  <div className="relative">
                    <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Funded Successfully
                    </div>
                    <div className="relative h-48 w-full">
                      <Image src={project.imageUrl || "/placeholder.svg"} alt={project.name} fill className="object-cover" priority />
                    </div>
                  </div>

                  <div className="p-4">
                    <h3 className="text-xl font-everett font-bold mb-2">{project.name}</h3>
                    <p className="text-sm text-gray-700 mb-4 line-clamp-2">{project.description}</p>

                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-green-600">{progress}% Funded</span>
                        <span>Goal: {formatSuiAmount(project.goalAmount)} SUI</span>
                      </div>
                      <div className="progress-bar">
                        <div
                          className="progress-bar-fill bg-green-500"
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-sm text-gray-600 border-t pt-4">
                      <div>
                        <span className="font-medium">{formatSuiAmount(project.currentAmount)}</span> SUI raised
                      </div>
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                        <span>100% Funded</span>
                      </div>
                    </div>
                  </div>
                </AnimationWrapper>
              );
            })}
          </div>
        )}
      </div>
    </section>
  )
}
