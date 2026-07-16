import type { Metadata } from "next";
import ProposalPage from "./ProposalPage";

export const metadata: Metadata = {
  title: "Aliice Pricing Proposal",
  description: "Aliice all-in-one medical practice management pricing proposal.",
};

export default function Proposal() {
  return <ProposalPage />;
}
