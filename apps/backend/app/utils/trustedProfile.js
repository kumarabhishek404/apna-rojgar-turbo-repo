/** Mongo match: name, address, mobile, photo, and at least one non-empty skill. */
export const TRUSTED_PROFILE_QUERY = {
  name: { $regex: /\S/ },
  address: { $regex: /\S/ },
  profilePicture: { $regex: /\S/ },
  $expr: {
    $and: [
      {
        $gt: [
          {
            $strLenCP: {
              $trim: {
                input: {
                  $convert: {
                    input: "$mobile",
                    to: "string",
                    onError: "",
                    onNull: "",
                  },
                },
              },
            },
          },
          0,
        ],
      },
      {
        $gt: [
          {
            $size: {
              $filter: {
                input: { $ifNull: ["$skills", []] },
                as: "s",
                cond: {
                  $gt: [
                    {
                      $strLenCP: {
                        $trim: {
                          input: {
                            $cond: [
                              { $eq: [{ $type: "$$s" }, "string"] },
                              "$$s",
                              {
                                $convert: {
                                  input: "$$s.skill",
                                  to: "string",
                                  onError: "",
                                  onNull: "",
                                },
                              },
                            ],
                          },
                        },
                      },
                    },
                    0,
                  ],
                },
              },
            },
          },
          0,
        ],
      },
    ],
  },
};

export function withTrustedProfileMatch(baseMatch) {
  return { $and: [baseMatch, TRUSTED_PROFILE_QUERY] };
}
