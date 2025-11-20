export type Domain = "client" | "hub";

export type MessagingOptions = {
  enableLog?: Domain | "both"; // can't pass a callback here, this data comes serialized along with each requests's params so have to deal with literals
};
