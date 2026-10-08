"""Contextual recommendation rules."""
from typing import List


def build_recommendations(score: float, status: str, minutes_to_poor=None,
                          has_video_call=False, video_call_in_min=None) -> List[dict]:
    recs = []
    if status == "poor":
        recs.append({"icon": "download", "title": "Download important files now",
                     "body": "Poor connectivity expected. Save offline copies before entering this zone.",
                     "action": "Prepare Offline"})
        recs.append({"icon": "message", "title": "Send pending messages",
                     "body": "Messages may fail in this zone. Send them while you still have signal.",
                     "action": "Open Messages"})
        recs.append({"icon": "video", "title": "Avoid video calls here",
                     "body": "Switch any upcoming video call to audio-only for this stretch.",
                     "action": "Switch Recommendation"})
    elif status == "unstable":
        recs.append({"icon": "download", "title": "Avoid bandwidth-heavy activity",
                     "body": "Prefer text/audio. Download anything critical before signal fluctuates.",
                     "action": "Prepare Offline"})
    else:
        recs.append({"icon": "check", "title": "No action required",
                     "body": "Connectivity looks reliable. You can stream, call and browse normally.",
                     "action": "All Good"})

    if minutes_to_poor is not None and minutes_to_poor <= 15 and status != "poor":
        recs.insert(0, {"icon": "alert",
                        "title": f"Connectivity degrades in ~{int(minutes_to_poor)} min",
                        "body": "Download important files now before entering the weak zone.",
                        "action": "Prepare Offline"})

    if has_video_call and video_call_in_min is not None and video_call_in_min <= 30 and score < 50:
        recs.insert(0, {"icon": "video",
                        "title": f"Your video call in {int(video_call_in_min)} min may be unstable",
                        "body": "Recommended: switch to audio-only or move to a stronger zone.",
                        "action": "Switch Recommendation"})
    return recs


def cause_for(load: float, tower: float, hist: float) -> str:
    bits = []
    if load >= 70:
        bits.append("High network load")
    if tower >= 1.8:
        bits.append("weak tower coverage")
    if hist < 55:
        bits.append("historically low reliability")
    if not bits:
        bits.append("Localized congestion")
    return " + ".join(bits)
