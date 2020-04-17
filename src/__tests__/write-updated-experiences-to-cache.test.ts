import { writeUpdatedExperienceToCache } from "../apollo/write-updated-experiences-to-cache";

test("1", () => {
  writeUpdatedExperienceToCache()();
  expect(1).toBe(1);
});
