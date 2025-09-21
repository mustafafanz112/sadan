import BubbleCanvas from "@/components/BubbleCanvas";
import GiftModal from "@/components/GiftModal";
import { useState } from "react";

export default function App() {
  const [selectedGift, setSelectedGift] = useState(null);

  return (
    <>
      <BubbleCanvas onBubbleClick={(gift) => setSelectedGift(gift)} />
      {selectedGift && (
        <GiftModal bubbleData={selectedGift} onClose={() => setSelectedGift(null)} /> 
      )}
    </>
  );
}
