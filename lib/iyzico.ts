import Iyzipay from 'iyzipay';

const iyzipay = new Iyzipay({
  apiKey: process.env.IYZICO_API_KEY || 'sandbox-api-key',
  secretKey: process.env.IYZICO_SECRET_KEY || 'sandbox-secret-key',
  uri: process.env.IYZICO_BASE_URL || 'https://sandbox-api.iyzipay.com'
});

export const createCheckoutForm = (params: {
  price: string;
  paidPrice: string;
  basketId: string;
  buyer: {
    id: string;
    name: string;
    surname: string;
    gsmNumber: string;
    email: string;
    identityNumber: string;
    registrationAddress: string;
    ip: string;
    city: string;
    country: string;
    zipCode: string;
  };
  callbackUrl: string;
}) => {
  return new Promise((resolve, reject) => {
    const request = {
      locale: Iyzipay.LOCALE.TR,
      conversationId: params.basketId,
      price: params.price,
      paidPrice: params.paidPrice,
      currency: Iyzipay.CURRENCY.TRY,
      basketId: params.basketId,
      paymentGroup: Iyzipay.PAYMENT_GROUP.PRODUCT,
      callbackUrl: params.callbackUrl,
      enabledInstallments: [1],
      buyer: {
        id: params.buyer.id,
        name: params.buyer.name,
        surname: params.buyer.surname,
        gsmNumber: params.buyer.gsmNumber,
        email: params.buyer.email,
        identityNumber: params.buyer.identityNumber,
        lastLoginDate: '2023-01-01 00:00:00', // Dummy data for required field
        registrationDate: '2023-01-01 00:00:00', // Dummy data for required field
        registrationAddress: params.buyer.registrationAddress,
        ip: params.buyer.ip,
        city: params.buyer.city,
        country: params.buyer.country,
        zipCode: params.buyer.zipCode
      },
      shippingAddress: {
        contactName: `${params.buyer.name} ${params.buyer.surname}`,
        city: params.buyer.city,
        country: params.buyer.country,
        address: params.buyer.registrationAddress,
        zipCode: params.buyer.zipCode
      },
      billingAddress: {
        contactName: `${params.buyer.name} ${params.buyer.surname}`,
        city: params.buyer.city,
        country: params.buyer.country,
        address: params.buyer.registrationAddress,
        zipCode: params.buyer.zipCode
      },
      basketItems: [
        {
          id: 'PRO_PLAN_1_MONTH',
          name: 'BerberBot Pro Abonelik (1 Aylık)',
          category1: 'Yazılım',
          category2: 'SaaS',
          itemType: Iyzipay.BASKET_ITEM_TYPE.VIRTUAL,
          price: params.price
        }
      ]
    };

    iyzipay.checkoutFormInitialize.create(request as any, function (err: any, result: any) {
      if (err) reject(err);
      else resolve(result);
    });
  });
};

export const retrieveCheckoutForm = (token: string) => {
  return new Promise((resolve, reject) => {
    iyzipay.checkoutForm.retrieve({
      locale: Iyzipay.LOCALE.TR,
      token: token
    }, function (err: any, result: any) {
      if (err) reject(err);
      else resolve(result);
    });
  });
};

export default iyzipay;
