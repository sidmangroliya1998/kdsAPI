import mongoose from 'mongoose';

export const RequestStub = () => {
  return {
    user: {
      userId: new mongoose.Types.ObjectId('63d299a9a6948cecdab48901'),
      supplierId: new mongoose.Types.ObjectId('63d299a9a6948cecdab48901'),
    },
  };
};
export const TokenStub = () => {
  return {
    token:
      'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFsZGl3YW4zMjFAZ21haWwuY29tIiwidXNlcklkIjoiNjQzNjgyNGVlZDU4ZWU5ZDUxZDIwNTM1Iiwic3VwcGxpZXJJZCI6IjY0MzY4MjRlZWQ1OGVlOWQ1MWQyMDUyOSIsInJvbGVJZCI6IjY1MWQwMTNiNDZjOWM4NWMzNzlmN2I0ZCIsImlzV2FpdGVyIjpmYWxzZSwiaXNWZW5kb3IiOmZhbHNlLCJpYXQiOjE3MDM4MjMzNDB9.jVxE6M7HpUuE90OaNqjzNYct4bOZpi0dUjbMo4B3CZY',
  };
};
