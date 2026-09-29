// Verbatim excerpts. Each links to the exact lines at a pinned commit.
export const excerpts = {
  sixthsense: {
    repo: "vishal-naveen/Sixth-Sense",
    path: "SixthSense/ViewController.swift",
    sha: "7ae2d600fc76e830e277075ef7001c89deb7a7dd",
    start: 1910, end: 1934, lang: "swift",
    title: "Pinhole distance from three box estimates, Kalman-smoothed",
    url: "https://github.com/vishal-naveen/Sixth-Sense/blob/7ae2d600fc76e830e277075ef7001c89deb7a7dd/SixthSense/ViewController.swift#L1910-L1934",
    code: String.raw`    let distanceByWidth = (referenceSize.width * focalLength) / (boxWidth * sensorWidth)
    let distanceByHeight = (referenceSize.height * focalLength) / (boxHeight * sensorHeight)
    let distanceByArea = (realArea * focalLength * focalLength) / (boxArea * sensorArea)
    
    let estimatedDistance = (distanceByWidth + distanceByHeight + distanceByArea) / 3.0
    
    return applyKalmanFilter(to: estimatedDistance)
}

private var lastEstimate: Double = 0
private var errorEstimate: Double = 1
private let q: Double = 0.1
private let r: Double = 0.1

private func applyKalmanFilter(to measurement: Double) -> Double {
    let prediction = lastEstimate
    errorEstimate += q

    let kalmanGain = errorEstimate / (errorEstimate + r)
    let estimate = prediction + kalmanGain * (measurement - prediction)
    errorEstimate = (1 - kalmanGain) * errorEstimate

    lastEstimate = estimate
    return estimate
}`,
  },
  ldpc: {
    repo: "vishal-naveen/rl-ldpc-decoding",
    path: "src/train_new_perfect_model.py",
    sha: "684b90726aacf10bd072944fb06946e6dedf8d11",
    start: 169, end: 196, lang: "python",
    title: "DQN environment step: recompute syndrome, shape the reward",
    url: "https://github.com/vishal-naveen/rl-ldpc-decoding/blob/684b90726aacf10bd072944fb06946e6dedf8d11/src/train_new_perfect_model.py#L169-L196",
    code: String.raw`# Fast syndrome computation
self.syndrome = (self.H @ self.current) % 2

weight = np.sum(self.syndrome)
success = (weight == 0)
done = success or self.steps >= self.max_steps

# Optimized reward computation
if success:
    # Success reward with efficiency bonus
    efficiency_bonus = (self.max_steps - self.steps) / self.max_steps
    reward = 50.0 * (1.0 + efficiency_bonus)
else:
    # Step penalty
    reward = -0.5
    
    # Progress reward
    if weight < self.prev_weight:
        # Made progress
        improvement = (self.prev_weight - weight) / self.initial_weight
        reward += 10.0 * improvement
    elif weight > self.prev_weight:
        # Made it worse
        reward -= 2.0

self.prev_weight = weight

return self.syndrome.astype(np.float32), reward, done, False, {'success': success}`,
  },
  tactilevla: {
    repo: "vishal-naveen/TactileVLA-Edge",
    path: "software/tools/tactilevla-record.sh",
    sha: "d14ea7db39e246edd747d92e496b55358083cb6d",
    start: 271, end: 286, lang: "bash",
    title: "Recording plan walks the 3x3 grid, holding out cell B2",
    url: "https://github.com/vishal-naveen/TactileVLA-Edge/blob/d14ea7db39e246edd747d92e496b55358083cb6d/software/tools/tactilevla-record.sh#L271-L286",
    code: "# Cell staging plan. lerobot-record prints the cell to stage in the SETUP banner\n# (look-ahead, which is when you actually place the object) and confirms it in the\n# RECORDING banner, then appends episode -> cell to CELL_LOG.\n#\n# The order is the perimeter of the 3x3 grid, counter-clockwise from A1, with the\n# centre cell B2 left out as the hold-out:\n#\n#         A       B       C\n#  far  [A1] <- [B1] <-  [C1]        A1 -> A2 -> A3 -> B3 -> C3 -> C2 -> C1 -> B1\n#       [A2]    [B2]*    [C2]  ^     * B2 = hold-out, record NOTHING here\n#  near [A3] -> [B3] ->  [C3]  |\n#\n# Indexing is off the dataset episode count, so it keeps its place across resume,\n# and every second round of 40 is walked in the opposite direction automatically.\nCELL_PLAN=\"${CELL_PLAN:-A1,A2,A3,B3,C3,C2,C1,B1}\"\nEPISODES_PER_CELL=\"${EPISODES_PER_CELL:-5}\"",
  },
  lerobotpr: {
    repo: "huggingface/lerobot",
    path: "src/lerobot/datasets/io_utils.py",
    sha: "d7ea6f3bd84fa7754cbcdc13a0b023fc2eaa063c",
    start: 299, end: 312, lang: "diff",
    title: "Convert PIL images to tensors in streaming item_to_torch",
    url: "https://github.com/huggingface/lerobot/pull/3798/files",
    code: String.raw`@@ -299,8 +299,14 @@ def item_to_torch(item: dict) -> dict:
         dict: Dictionary with all tensor-like items converted to torch.Tensor.
     """
     skip_keys = {"task", *LANGUAGE_COLUMNS}
+    to_tensor = transforms.ToTensor()
     for key, val in item.items():
-        if isinstance(val, (np.ndarray | list)) and key not in skip_keys:
+        if key in skip_keys:
+            continue
+        if isinstance(val, PILImage.Image):
+            # Same conversion as hf_transform_to_torch: PIL (H, W, C) uint8 -> (C, H, W) float32 in [0, 1]
+            item[key] = to_tensor(val)
+        elif isinstance(val, (np.ndarray | list)):
             # Convert numpy arrays and lists to torch tensors
             item[key] = torch.tensor(val)
     return item`,
  },
  decode: {
    repo: "vishal-naveen/Midnight_Decode",
    path: "TeamCode/src/main/java/org/firstinspires/ftc/teamcode/config/Utilities/configs/ShooterCalculator.java",
    sha: "be18d056ed1bc7c439b444f53090ee678a8f45fd",
    start: 36, end: 63, lang: "java",
    title: "Limelight ty to goal distance, then flywheel RPM from a lookup table",
    url: "https://github.com/vishal-naveen/Midnight_Decode/blob/be18d056ed1bc7c439b444f53090ee678a8f45fd/TeamCode/src/main/java/org/firstinspires/ftc/teamcode/config/Utilities/configs/ShooterCalculator.java#L36-L63",
    code: String.raw`public static double getDistanceFromLimelight(double ty) {
    double heightDiff = LimelightConstants.goalHeight - LimelightConstants.cameraHeight;
    double angleToTarget = LimelightConstants.cameraAngle + ty;

    if (angleToTarget <= 0) {
        return 144.0;
    }

    double angleRad = Math.toRadians(angleToTarget);

    if (Math.abs(Math.tan(angleRad)) < 0.001) {
        return 72.0;
    }

    double distance = heightDiff / Math.tan(angleRad);
    distance += LimelightConstants.distanceOffset;
    return Math.max(12.0, Math.min(144.0, distance));
}

public static double getRPMForDistance(double distance) {
    if (distance < 31) distance = 31;
    if (distance > 139) distance = 139;

    double rpm = rpmTable.get(distance);
    rpm = (rpm * rpmMultiplier) + rpmOffset;

    return Math.max(0, rpm);
}`,
  },
  intothedeep: {
    repo: "vishal-naveen/Midnight_IntoTheDeep",
    path: "TeamCode/src/main/java/Subsystem/Push3Specimen.java",
    sha: "d3941801d831c04df3a79bd872218b96c44dbfca",
    start: 123, end: 149, lang: "java",
    title: "Pedro Pathing Bezier paths for the five-specimen auto's sample push",
    url: "https://github.com/vishal-naveen/Midnight_IntoTheDeep/blob/d3941801d831c04df3a79bd872218b96c44dbfca/TeamCode/src/main/java/Subsystem/Push3Specimen.java#L123-L149",
    code: String.raw`public static PathChain paths() {

    blueLineDirect = new Path(new BezierCurve(new Point(preload), new Point(21.8, 74), new Point(13.2, 25),new Point(blueLineUp)));
    blueLineDirect.setLinearHeadingInterpolation(preload.getHeading(), blueLineUp.getHeading());

    blueLineUpToPushBlock1 = new Path(new BezierCurve(new Point(blueLineUp), new Point(61.6, 24.4), new Point(pushBlock1)));
    blueLineUpToPushBlock1.setLinearHeadingInterpolation(blueLineUp.getHeading(), pushBlock1.getHeading());
    blueLineUpToPushBlock1.setPathEndVelocityConstraint(1.0);

    pushBlock1ToPushBlock2Up = new Path(new BezierCurve(new Point(pushBlock1), new Point(57.5, 27.8), new Point(pushBlock2Up)));
    pushBlock1ToPushBlock2Up.setLinearHeadingInterpolation(pushBlock1.getHeading(), pushBlock2Up.getHeading());

    pushBlock2UpToPushBlock2 = new Path(new BezierLine(new Point(pushBlock2Up), new Point(pushBlock2)));
    pushBlock2UpToPushBlock2.setLinearHeadingInterpolation(pushBlock2Up.getHeading(), pushBlock2.getHeading());


    pushBlock2ToPushBlock3Up = new Path(new BezierCurve(new Point(pushBlock2), new Point(55, 17.4), new Point(pushBlock3Up)));
    pushBlock2ToPushBlock3Up.setLinearHeadingInterpolation(pushBlock2.getHeading(), pushBlock3Up.getHeading());

    pushBlock3UpToPushBlock3 = new Path(new BezierLine(new Point(pushBlock3Up), new Point(pushBlock3)));
    pushBlock3UpToPushBlock3.setLinearHeadingInterpolation(pushBlock3Up.getHeading(), pushBlock3.getHeading());

    pushBlock3ToFinal = new Path(new BezierCurve(new Point(pushBlock3), new Point(23.7, 24.3), new  Point(pushBlock3Final)));
    pushBlock3ToFinal.setLinearHeadingInterpolation(pushBlock3.getHeading(), pushBlock3Final.getHeading());

    pushBlock3ToFinalFINAL = new Path(new BezierLine(new Point(pushBlock3Final),  new  Point(pickUpAlt)));
    pushBlock3ToFinalFINAL.setLinearHeadingInterpolation(pushBlock3.getHeading(), pushBlock3Final.getHeading());`,
  },
};
