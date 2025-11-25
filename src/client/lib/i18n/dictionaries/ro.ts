import { CreateExtensionPaymentLinkFormStep } from '~/client/modules/(app)/payment-links/create/create-extension-payment-link-form/stepper/config'
import { CreateProductPaymentLinkFormStep } from '~/client/modules/(app)/payment-links/create/create-product-payment-link-form/stepper/config'
import { CheckoutFormSection } from '~/client/modules/checkout/checkout-form/schema'
import { CheckoutFormStep } from '~/client/modules/checkout/checkout-form/stepper/config'
import { CreateExtensionPaymentLinkFormSection } from '~/shared/create-extension-payment-link-form/enums/create-extension-payment-link-form-sections'
import { CreateProductPaymentLinkFormSection } from '~/shared/create-product-payment-link-form/enums/create-product-payment-link-form-sections'
import { MembershipStatusType } from '~/shared/enums/membership-status-type'
import { OrderStatusType } from '~/shared/enums/order-status-type'
import { OrderType } from '~/shared/enums/order-type'
import { PaymentCurrencyType } from '~/shared/enums/payment-currency-type'
import { PaymentLinkType } from '~/shared/enums/payment-link-type'
import { PaymentMethodType } from '~/shared/enums/payment-method-type'
import { PaymentProductType } from '~/shared/enums/payment-product-type'
import { PaymentStatusType } from '~/shared/enums/payment-status'
import { SubscriptionStatusType } from '~/shared/enums/subscription-status-type'
import { UserRoles } from '~/shared/enums/user-roles'

const dictionary = {
  components: {
    'data-table': {
      'no-results': 'Nu există rezultate.',
      pagination: {
        'next-page': 'Înainte',
        'previous-page': 'Înapoi',
        'rows-per-page': 'Rânduri pe pagină'
      },

      select: {
        of: 'din',
        'selected-row': 'Rând selectat',
        'selected-rows': 'Rânduri selectate'
      },

      'table-actions': 'Acțiuni'
    },
    dialogs: {
      'edit-user': {
        buttons: {
          cancel: 'Anulează',
          confirm: 'Modifică'
        },
        description: 'Modifică un utilizator existent.',

        form: {
          fields: {
            email: {
              label: 'Adresa de e-mail',
              placeholder: 'Adresa de e-mail utilizatorului',
              validation: {
                email: 'Adresa de e-mail este invalidă.'
              }
            },
            name: {
              label: 'Numele',
              placeholder: 'Numele utilizatorului',
              validation: {
                'min-one':
                  'Numele utilizatorului trebuie să fie minim 1 caracter.'
              }
            }
          }
        },

        response: {
          error: {
            description: 'A apărut o eroare la modificarea utilizatorului.',
            title: 'Modificare eșuată'
          },
          success: {
            description: 'Utilizatorul a fost modificat cu succes.',
            title: 'Modificare reușită'
          }
        },
        title: 'Modifică utilizatorul'
      },

      'import-users': {
        buttons: {
          cancel: 'Anulează',
          confirm: 'Importă'
        },
        description: 'Importă utilizatori dintr-un fișier Excel.',
        'description-file-not-selected':
          'Importă utilizatorii dintr-un fișier Excel.',
        'description-file-selected':
          'Importă {count, plural, =1 {un utilizator} other {# de utilizatori}} din fișierul <filename></filename>.',

        form: {
          buttons: {
            delete: 'Șterge'
          },
          fields: {
            email: {
              label: 'Adresa de e-mail',
              placeholder: 'Adresa de e-mail utilizatorului',
              validation: {
                duplicate:
                  'Adresa de e-mail este duplicată a utilizatorului {duplicate}.',
                email: 'Adresa de e-mail este invalidă.',
                exists: 'Adresa de e-mail este deja înregistrată.'
              }
            },
            name: {
              label: 'Numele',
              placeholder: 'Numele utilizatorului',
              validation: {
                'min-one':
                  'Numele utilizatorului trebuie să fie minim 1 caracter.'
              }
            },
            selected: {
              label: 'Selectează pentru import',
              validation: {
                'min-one': 'Trebuie să selectați cel puțin un utilizator.'
              }
            }
          },
          legend: 'Utilizatorul {index}'
        },

        response: {
          error: {
            description: 'A apărut o eroare la importarea utilizatorilor.',
            title: 'Importare eșuată'
          },
          success: {
            description:
              '{count, plural, =1 {Utilizatorul a fost importat cu succes.} other {# de utilizatori au fost importați cu succes.}}',
            title: 'Importare reușită'
          }
        },
        title: 'Importă utilizatori'
      },

      'import-users-results': {
        buttons: {
          cancel: 'Închide'
        },
        'description-filename':
          'Rezultatele importării utilizatorilor din fișierul <filename></filename>.',
        'description-no-filename':
          'Rezultatele importării utilizatorilor din fișierul Excel.',

        duplicates: {
          description:
            'S-a incercat importarea {count, plural, =1 {unui utilizator} other {a # utilizatori}} care există deja.',

          item: {
            description: 'E-mailul este duplicat a utilizatorului:'
          },
          title: 'Duplicări'
        },
        title: 'Rezultate importării utilizatorilor',

        users: {
          description:
            '{count, plural, =1 {Un utilizator a fost importat cu succes.} other {# de utilizatori au fost importați cu succes.}}',
          title: 'Utilizatori importați'
        }
      }
    },

    'file-dropzone': {
      'drop-file':
        'Trage și eliberează fișierul Excel aici sau dǎ clic pentru a îl selecta',
      'invalid-file':
        'Fișierul este invalid, depășește dimensiunea maximă de {maxSize} Mb sau ați adǎugat mai multe fișiere.',
      'loading-file': 'Se încarcă fișierul...',

      'max-size': 'Dimensiunea maximă a fișierului este de {maxSize} Mb.',
      'processing-file': 'Fișierul se procesează...',
      'release-file': 'Eliberează fișierul aici'
    },

    'pdf-dropzone': {
      'drop-file':
        'Trage și eliberează fișierul PDF aici sau dă clic pentru a îl selecta',
      'file-selected': 'Fișier selectat',
      'invalid-file':
        'Fișierul este invalid, depășește dimensiunea maximă de {maxSize} Mb sau formatul nu este PDF.',
      'max-size': 'Dimensiunea maximă a fișierului este de {maxSize} Mb.',
      'release-file': 'Eliberează fișierul aici'
    },

    'theme-select': {
      title: 'Temă vizuală',
      values: {
        dark: 'Întunecată',
        light: 'Luminoasă',
        system: 'Sistem'
      }
    },

    utils: {
      'error-page': {
        button: 'Mergi la pagina principală',
        description:
          'Ne pare rău, a apărut o eroare la încărcarea acestei pagini.',
        title: 'A apărut o eroare'
      },
      'loading-page': {
        description: 'Vă rugăm așteptați, conținutul se încarcă.',
        title: 'Încărcare...'
      },
      'not-found-page': {
        button: 'Mergi la pagina principală',
        description:
          'Se pare că pagina <component>{pathname}</component> nu există.',
        title: 'Pagina nu a fost găsită'
      }
    }
  },

  modules: {
    '(app)': {
      '(admin)': {
        constants: {
          'update-eur-to-ron-rate-form': {
            buttons: {
              submit: {
                default: 'Modifică cursul Euro la RON',
                loading: 'Se modifică cursul Euro la RON...'
              },
              update: {
                default: 'Actualizează cursul Euro la RON',
                loading: 'Se actualizează cursul Euro la RON...'
              }
            },
            fields: {
              eurToRonRate: {
                description:
                  'Cursul Euro la RON va fi utilizat pentru calculul prețurilor.',
                placeholder: 'Introduceți valoarea in lei',
                title: 'Cursul Euro la RON'
              }
            },

            response: {
              submit: {
                error: {
                  description:
                    'A apărut o eroare la modificarea cursului Euro la RON.',
                  title: 'Modificarea cursului Euro la RON este eșuată'
                },
                success: {
                  description: 'Cursul Euro la RON a fost modificat cu succes.',
                  title: 'Modificarea cursului Euro la RON este reușită'
                }
              }
            }
          },

          'update-tva-rate-form': {
            buttons: {
              submit: {
                default: 'Modifică procentul TVA',
                loading: 'Se modifică procentul TVA...'
              }
            },
            fields: {
              tvaRate: {
                description:
                  'Procentul TVA va fi utilizat pentru calculul prețurilor.',
                placeholder: 'Introduceți procentul TVA',
                title: 'Procentul TVA'
              }
            },
            response: {
              submit: {
                error: {
                  description:
                    'A apărut o eroare la modificarea procentului TVA.',
                  title: 'Modificarea procentului TVA este eșuată'
                },
                success: {
                  description: 'Procentul TVA a fost modificat cu succes.',
                  title: 'Modificarea procentului TVA este reușită'
                }
              }
            }
          }
        },
        products: {
          _components: {
            'delete-product-dialog': {
              buttons: {
                cancel: 'Anulează',
                confirm: { default: 'Șterge', loading: 'Se șterge produsul...' }
              },
              description:
                'Ești sigur că vrei să ștergi <product-name>{name}</product-name>?',

              extensions: {
                fields: {
                  extensionMonths: 'Durata prelungirii',
                  legend: 'Opțiunea {number} de prelungire',
                  minDepositAmount: 'Avans minim',
                  price: 'Preț integral'
                },

                installments: {
                  fields: {
                    count: 'Număr rate',
                    pricePerInstallment: 'Preț per rată',
                    totalPrice: 'Preț total'
                  },
                  title: 'Opțiuni de rate'
                },
                title: 'Opțiuni de prelungiri'
              },

              installments: {
                count: 'Număr rate',
                description: 'Opțiunile de plată în rate pentru produs.',
                pricePerInstallment: 'Preț per rată',
                title: 'Opțiuni de rate',
                totalPrice: 'Preț total'
              },

              'product-details': {
                membershipDurationMonths: 'Durata membership',
                minDepositAmount: 'Avans minim',

                name: 'Nume produs',
                price: 'Preț integral',
                title: 'Detalii produs'
              },

              response: {
                error: {
                  description: 'A apărut o eroare la ștergerea produsului.',
                  title: 'Ștergere eșuată'
                },
                success: {
                  description: 'Produsul a fost șters cu succes.',
                  title: 'Ștergere reușită'
                }
              },
              title: 'Șterge {name}'
            },
            'product-item': {
              buttons: {
                'delete-product': 'Șterge produsul',
                'edit-product': 'Modifică produsul'
              },
              membershipDurationMonths:
                'Durata: {membershipDurationMonths, plural, =1 {o lună} other {# luni}}',
              minDepositAmount: 'Avans minim: {minDepositAmount}',
              price: 'Preț integral: {price}'
            }
          },

          '[productId]': {
            delete: 'Șterge produsul',
            edit: 'Modifică produsul',

            extensions: {
              fields: {
                extensionMonths: 'Durata prelungirii',
                legend: 'Opțiunea {number} de prelungire',
                minDepositAmount: 'Avans minim',
                price: 'Preț integral'
              },

              installments: {
                fields: {
                  count: 'Număr rate',
                  pricePerInstallment: 'Preț per rată',
                  totalPrice: 'Preț total'
                },
                title: 'Opțiuni de rate'
              },
              title: 'Opțiuni de prelungiri'
            },

            installments: {
              count: 'Număr rate',
              description: 'Opțiunile de plată în rate pentru produs.',
              pricePerInstallment: 'Preț per rată',
              title: 'Opțiuni de rate',
              totalPrice: 'Preț total'
            },

            'product-details': {
              membershipDurationMonths: 'Durata membership',
              minDepositAmount: 'Avans minim',

              name: 'Nume produs',
              price: 'Preț integral',
              title: 'Detalii produs'
            }
          },

          create: {
            form: {
              buttons: {
                submit: {
                  default: 'Adaugă produs',
                  loading: 'Se adaugă produsul...'
                }
              },
              fields: {
                extensions: {
                  add: 'Adaugă prelungire',

                  fields: {
                    extensionMonths: {
                      label: 'Durata prelungirii',
                      placeholder: 'Durata prelungirii'
                    },

                    installments: {
                      add: 'Adaugă ratǎ prelungire',

                      fields: {
                        count: {
                          label: 'Rate',
                          placeholder: 'Numărul de rate'
                        },
                        pricePerInstallment: {
                          label: 'Preț per rată',
                          placeholder: 'Prețul per rată'
                        }
                      },
                      remove: 'Șterge',
                      title: 'Opțiuni de rate'
                    },
                    isDepositAmountEnabled: {
                      label: 'Activeazǎ posibilitatea avansului minim'
                    },
                    legend: 'Opțiunea {number} de prelungire',
                    minDepositAmount: {
                      label: 'Avans minim',
                      placeholder: 'Avansul minim'
                    },
                    price: {
                      label: 'Preț integral',
                      placeholder: 'Prețul prelungirii'
                    }
                  },
                  remove: 'Șterge',
                  title: 'Opțiuni de prelungiri'
                },
                installments: {
                  add: 'Adaugă ratǎ',

                  fields: {
                    count: {
                      header: 'Număr rate',
                      placeholder: 'Numărul de rate'
                    },
                    pricePerInstallment: {
                      header: 'Preț per rată',
                      placeholder: 'Prețul per rată'
                    },
                    totalPrice: { header: 'Preț total' }
                  },
                  title: 'Opțiuni de rate'
                },
                isDepositAmountEnabled: {
                  label: 'Activeazǎ posibilitatea avansului minim'
                },
                membershipDurationMonths: {
                  addon: 'luni',
                  label: 'Durata membership',
                  placeholder: 'Durata membership-ului'
                },
                minDepositAmount: {
                  label: 'Avans minim',
                  placeholder: 'Avansul minim'
                },

                name: {
                  label: 'Nume produs',
                  placeholder: 'Numele produsului'
                },
                price: {
                  label: 'Preț integral',
                  placeholder: 'Prețul integral'
                },
                title: 'Detalii produs'
              }
            },

            response: {
              error: {
                description: 'A apărut o eroare la adaugarea produsului.',
                title: 'Adaugare eșuată'
              },
              success: {
                description: 'Produsul a fost adaugat cu succes.',
                title: 'Adaugare reușită'
              }
            }
          },
          'create-product': 'Adaugă un produs nou',
          edit: {
            form: {
              buttons: {
                submit: {
                  default: 'Modificǎ produs',
                  loading: 'Se modificǎ produsul...'
                }
              },
              fields: {
                extensions: {
                  add: 'Adaugă prelungire',

                  fields: {
                    extensionMonths: {
                      label: 'Durata prelungirii',
                      placeholder: 'Durata prelungirii'
                    },

                    installments: {
                      add: 'Adaugă ratǎ prelungire',

                      fields: {
                        count: {
                          label: 'Rate',
                          placeholder: 'Numărul de rate'
                        },
                        pricePerInstallment: {
                          label: 'Preț per rată',
                          placeholder: 'Prețul per rată'
                        }
                      },
                      remove: 'Șterge',
                      title: 'Opțiuni de rate'
                    },
                    legend: 'Opțiunea {number} de prelungire',
                    minDepositAmount: {
                      label: 'Avans minim',
                      placeholder: 'Avansul minim'
                    },
                    price: {
                      label: 'Preț integral',
                      placeholder: 'Prețul prelungirii'
                    }
                  },
                  remove: 'Șterge',
                  title: 'Opțiuni de prelungiri'
                },
                installments: {
                  add: 'Adaugă ratǎ',

                  fields: {
                    count: {
                      header: 'Număr rate',
                      placeholder: 'Numărul de rate'
                    },
                    pricePerInstallment: {
                      header: 'Preț per rată',
                      placeholder: 'Prețul per rată'
                    },
                    totalPrice: { header: 'Preț total' }
                  },
                  title: 'Opțiuni de rate'
                },
                membershipDurationMonths: {
                  addon: 'luni',
                  label: 'Durata membership',
                  placeholder: 'Durata membership-ului'
                },
                minDepositAmount: {
                  label: 'Avans minim',
                  placeholder: 'Avansul minim'
                },

                name: {
                  label: 'Nume produs',
                  placeholder: 'Numele produsului'
                },
                price: {
                  label: 'Preț integral',
                  placeholder: 'Prețul integral'
                },
                title: 'Detalii produs'
              }
            },

            response: {
              error: {
                description: 'A apărut o eroare la modificarea produsului.',
                title: 'Modificare eșuată'
              },
              success: {
                description: 'Produsul a fost modificat cu succes.',
                title: 'Modificare reușită'
              }
            }
          }

          // 'create-product-dialog': {
          //   title: 'Adaugă produs',
          //   description: 'Adaugă un produs nou.',
          //   form: {
          //     fields: {
          //       name: {
          //         title: 'Nume produs',
          //         placeholder: 'Introduceți numele produsului'
          //       },
          //       'membership-duration-months': {
          //         title: 'Durata subscripției (în luni)',
          //         placeholder: 'Introduceți durata subscripției',
          //         addon: 'luni'
          //       },
          //       price: {
          //         title: 'Preț (în euro)',
          //         placeholder: 'Introduceți prețul produsului'
          //       },
          //       'min-deposit-amount': {
          //         title: 'Avans minim (în euro)',
          //         placeholder: 'Introduceți avansul minim'
          //       },
          //       'installments-options': {
          //         title: 'Opțiuni de rate',
          //         description: 'Opțiuni de rate pentru produs.',
          //         fields: {
          //           installments: {
          //             title: 'Rate',
          //             placeholder: 'Introduceți numărul de rate'
          //           },
          //           'price-per-installment': {
          //             title: 'Preț per rată (în euro)',
          //             placeholder: 'Introduceți prețul per rată'
          //           }
          //         },
          //         'add-installment': 'Adaugă o rată'
          //       }
          //     }
          //   },
          //   response: {
          //     success: {
          //       title: 'Adaugare reușită',
          //       description: 'Produsul a fost adaugat cu succes.'
          //     },
          //     error: {
          //       title: 'Adaugare eșuată',
          //       description: 'A apărut o eroare la adaugarea produsului.'
          //     }
          //   },
          //   buttons: {
          //     cancel: 'Anulează',
          //     submit: { default: 'Adaugă', loading: 'Se adaugă produsul...' }
          //   }
          // },
          // 'delete-product-dialog': {
          //   title: 'Șterge {name}',
          //   description: 'Ești sigur/ă că vrei să ștergi <product-name>{name}</product-name>?',
          //   response: {
          //     success: {
          //       title: 'Ștergere reușită',
          //       description: 'Produsul a fost șters cu succes.'
          //     },
          //     error: {
          //       title: 'Ștergere eșuată',
          //       description: 'A apărut o eroare la ștergerea produsului.'
          //     }
          //   },
          //   buttons: {
          //     cancel: 'Anulează',
          //     confirm: { default: 'Șterge', loading: 'Se șterge produsul...' }
          //   }
          // },
          // 'update-product-dialog': {
          //   title: 'Modifică produsul',
          //   form: {
          //     fields: {
          //       name: {
          //         title: 'Nume produs',
          //         placeholder: 'Introduceți numele produsului'
          //       },
          //       'membership-duration-months': {
          //         title: 'Durata subscripției (în luni)',
          //         placeholder: 'Introduceți durata subscripției',
          //         addon: 'luni'
          //       },
          //       price: {
          //         title: 'Preț (în euro)',
          //         placeholder: 'Introduceți prețul produsului'
          //       },
          //       'min-deposit-amount': {
          //         title: 'Avans minim (în euro)',
          //         placeholder: 'Introduceți avansul minim'
          //       },
          //       'installments-options': {
          //         title: 'Opțiuni de rate',
          //         description: 'Opțiuni de rate pentru produs.',
          //         fields: {
          //           installments: {
          //             title: 'Rate',
          //             placeholder: 'Introduceți numărul de rate'
          //           },
          //           'price-per-installment': {
          //             title: 'Preț per rată (în euro)',
          //             placeholder: 'Introduceți prețul per rată'
          //           }
          //         },
          //         'add-installment': 'Adaugă o rată'
          //       }
          //     }
          //   },
          //   response: {
          //     success: {
          //       title: 'Modificare reușită',
          //       description: 'Produsul a fost modificat cu succes.'
          //     },
          //     error: {
          //       title: 'Modificare eșuată',
          //       description: 'A apărut o eroare la modificarea produsului.'
          //     }
          //   },
          //   buttons: {
          //     cancel: 'Anulează',
          //     submit: { default: 'Modifică', loading: 'Se modifică produsul...' }
          //   }
          // }
        },

        settings: {
          'eur-to-ron-rate': {
            buttons: {
              submit: {
                default: 'Salvează',
                loading: 'Se salvează rata EUR-RON...'
              }
            },
            description: 'Cursul EUR la RON pentru calcularea prețurilor.',
            placeholder: 'Introduceți cursul EUR la RON',
            response: {
              error: {
                description:
                  'A apărut o eroare la salvarea cursului EUR la RON.',
                title: 'Salvare eșuată'
              },
              success: {
                description: 'Cursul EUR la RON a fost salvat cu succes.',
                title: 'Salvare reușită'
              }
            },
            title: 'Cursul EUR la RON'
          },
          'first-payment-date-after-deposit-options': {
            buttons: {
              add: 'Adaugă opțiune',
              submit: {
                default: 'Salvează',
                loading: 'Se salvează...'
              }
            },
            description:
              'Opțiuni de zile pentru alegerea datei primei plati dupa avans.',
            item: {
              label: 'Opțiunea {index}',
              placeholder: 'Introduceți numărul de zile dupa avans'
            },
            placeholder: 'Introduceți numărul de zile dupa avans',
            response: {
              error: {
                description:
                  'A apărut o eroare la salvarea opțiunilor de zile.',
                title: 'Salvare eșuată'
              },
              success: {
                description: 'Opțiunile de zile au fost salvate cu succes.',
                title: 'Salvare reușită'
              }
            },
            title:
              'Opțiuni de zile pentru alegerea datei primei plati dupa avans'
          },
          'payment-settings': {
            buttons: {
              add: 'Adaugă setare',
              submit: {
                default: 'Salvează',
                loading: 'Se salvează setările de plată...'
              }
            },
            description: 'Setări de plată pentru produse.',
            form: {
              fields: {
                currency: {
                  description: 'Moneda pentru plată.',
                  label: 'Monedă',
                  placeholder: 'Selectează moneda'
                },
                extraTaxRate: {
                  description: 'Calculat înainte de TVA.',
                  label: 'Comision extra',
                  placeholder: 'Introduceți comisionul extra'
                },
                label: {
                  description: 'Numele setării de plată.',
                  label: 'Nume',
                  placeholder: 'Introduceți numele setării de plată'
                },
                tvaRate: {
                  description: 'TVA-ul pentru plată.',
                  label: 'TVA',
                  placeholder: 'Introduceți TVA-ul'
                }
              },
              item: {
                legend: 'Setarea de plată {index}'
              }
            },
            response: {
              error: {
                description:
                  'A apărut o eroare la salvarea setărilor de plată.',
                title: 'Salvare eșuată'
              },
              success: {
                description: 'Setările de plată au fost salvate cu succes.',
                title: 'Salvare reușită'
              }
            },
            title: 'Setări de plată'
          },

          'contract-settings': {
            'add-dialog': {
              buttons: {
                cancel: 'Anulează',
                confirm: {
                  default: 'Adaugă',
                  loading: 'Se adaugă contractul...'
                }
              },
              description: 'Încarcă un fișier PDF și adaugă un contract nou.',
              form: {
                fields: {
                  name: {
                    label: 'Nume contract',
                    placeholder: 'Introduceți numele contractului'
                  }
                }
              },
              response: {
                error: {
                  description: 'A apărut o eroare la adăugarea contractului.',
                  title: 'Adăugare eșuată'
                },
                success: {
                  description: 'Contractul a fost adăugat cu succes.',
                  title: 'Adăugare reușită'
                }
              },
              title: 'Adaugă contract'
            },
            buttons: {
              add: 'Adaugă contract'
            },
            'delete-dialog': {
              buttons: {
                cancel: 'Anulează',
                confirm: {
                  default: 'Șterge',
                  loading: 'Se șterge contractul...'
                }
              },
              description:
                'Ești sigur că vrei să ștergi contractul <contract-name>{name}</contract-name>?',
              response: {
                error: {
                  description: 'A apărut o eroare la ștergerea contractului.',
                  title: 'Ștergere eșuată'
                },
                success: {
                  description: 'Contractul a fost șters cu succes.',
                  title: 'Ștergere reușită'
                }
              },
              title: 'Șterge contract'
            },
            description: 'Gestionează contractele disponibile pentru link-urile de plată.',
            'edit-dialog': {
              buttons: {
                cancel: 'Anulează',
                confirm: {
                  default: 'Salvează',
                  loading: 'Se salvează contractul...'
                }
              },
              description: 'Modifică numele contractului.',
              form: {
                fields: {
                  name: {
                    label: 'Nume contract',
                    placeholder: 'Introduceți numele contractului'
                  }
                }
              },
              response: {
                error: {
                  description: 'A apărut o eroare la salvarea contractului.',
                  title: 'Salvare eșuată'
                },
                success: {
                  description: 'Contractul a fost salvat cu succes.',
                  title: 'Salvare reușită'
                }
              },
              title: 'Editează contract'
            },
            empty: 'Nu există contracte. Adaugă primul contract.',
            title: 'Contracte'
          }
        },
        users: {
          _components: {
            'ban-user-dialog': {
              'ban-user-form': {
                buttons: {
                  cancel: 'Anulează',
                  confirm: {
                    default: 'Banează',
                    loading: 'Se banează utilizatorul...'
                  }
                },
                fields: {
                  banExpireDate: {
                    description:
                      'Dacă lasi campul gol, utilizatorul va fi banat permanent.',
                    placeholder: 'Expirǎ la...',
                    title: 'Termen de expirare'
                  },
                  banReason: {
                    description:
                      'Introduceți motivul pentru care banezi utilizatorul',
                    placeholder:
                      'Motivul pentru care banez utilizatorul este...',
                    title: 'Motivul'
                  }
                }
              },
              description: 'Ești sigur că vrei să banezi utilizatorul?',

              response: {
                error: {
                  description: 'A apărut o eroare la banarea utilizatorului.',
                  title: 'Banare eșuată'
                },
                success: {
                  description: 'Utilizatorul a fost banat cu succes.',
                  title: 'Banare reușită'
                }
              },
              title: 'Banează utilizatorul'
            },

            'create-user-dialog': {
              'create-user-form': {
                buttons: {
                  cancel: 'Anulează',
                  submit: {
                    default: 'Adaugă utilizator',
                    loading: 'Se adaugă utilizatorul...'
                  }
                },
                fields: {
                  email: {
                    placeholder: 'Adresa de e-mail utilizatorului',
                    title: 'Adresa de e-mail'
                  },
                  firstName: {
                    placeholder: 'Prenume utilizatorului',
                    title: 'Prenume'
                  },
                  lastName: {
                    placeholder: 'Nume utilizatorului',
                    title: 'Nume'
                  },
                  phoneNumber: {
                    placeholder: 'Număr de telefon utilizatorului',
                    title: 'Număr de telefon'
                  }
                }
              },
              description: 'Adaugă un utilizator nou.',
              response: {
                error: {
                  description: 'A apărut o eroare la adaugarea utilizatorului.',
                  title: 'Adaugare eșuată'
                },
                success: {
                  description: 'Utilizatorul a fost adaugat cu succes.',
                  title: 'Adaugare reușită'
                }
              },
              title: 'Adaugă utilizator'
            },

            'demote-user-dialog': {
              buttons: {
                cancel: 'Anulează',
                confirm: {
                  default: 'Demotează',
                  loading: 'Se demotează utilizatorul la user...'
                }
              },
              description:
                'Ești sigur că vrei să demotezi utilizatorul la user?',

              response: {
                error: {
                  description:
                    'A apărut o eroare la demotearea utilizatorului la user.',
                  title: 'Demotează eșuată'
                },
                success: {
                  description:
                    'Utilizatorul a fost demoteat la user cu succes.',
                  title: 'Demotează reușită'
                }
              },
              title: 'Demotează utilizatorul la user'
            },

            'edit-user-dialog': {
              description: 'Modifică un utilizator.',

              'edit-user-form': {
                buttons: {
                  cancel: 'Anulează',
                  submit: {
                    default: 'Modifică utilizatorul',
                    loading: 'Se modifică utilizatorul...'
                  }
                },
                fields: {
                  email: {
                    placeholder: 'Adresa de e-mail utilizatorului',
                    title: 'Adresa de e-mail'
                  },
                  firstName: {
                    placeholder: 'Prenume utilizatorului',
                    title: 'Prenume'
                  },
                  lastName: {
                    placeholder: 'Nume utilizatorului',
                    title: 'Nume'
                  },
                  phoneNumber: {
                    placeholder: 'Număr de telefon utilizatorului',
                    title: 'Număr de telefon'
                  }
                }
              },

              response: {
                error: {
                  description:
                    'A apărut o eroare la modificarea utilizatorului.',
                  title: 'Modificare eșuată'
                },
                success: {
                  description: 'Utilizatorul a fost modificat cu succes.',
                  title: 'Modificare reușită'
                }
              },
              title: 'Modifică utilizatorul'
            },

            'export-users-dialog': {
              buttons: {
                cancel: 'Anulează',
                confirm: {
                  default: 'Exportă',
                  loading: 'Se exportă utilizatorii...'
                }
              },

              columns: {
                banExpires: 'Banat până la',
                banExpiresValue: 'Banat până la (valoare internǎ)',
                banned: 'Status ban',
                createdAt: 'Adăugat la',
                createdAtValue: 'Adăugat la (valoare internǎ)',
                email: 'E-mail',
                emailVerified: 'E-mail verificat',
                firstName: 'Prenume',
                id: 'Id',
                invitedBy_name: 'Invitat de',
                lastName: 'Nume',
                name: 'Nume complet',
                phoneNumber: 'Număr de telefon',
                role: 'Rol',
                updatedAt: 'Actualizat la',
                updatedAtValue: 'Actualizat la (valoare internǎ)'
              },
              description:
                'Ești sigur că vrei să exporti utilizatorii selectați?',

              filename: {
                placeholder: 'Introduceți numele fișierului',
                title: 'Nume fișier'
              },

              response: {
                error: {
                  description:
                    'A apărut o eroare la exportarea utilizatorilor.',
                  title: 'Exportare eșuată'
                },
                success: {
                  description: 'Utilizatorii au fost exportați cu succes.',
                  title: 'Exportare reușită'
                }
              },
              title: 'Exportă utilizatori'
            },

            'import-users-dialog': {
              buttons: {
                cancel: 'Anulează',
                confirm: {
                  default: 'Importă',
                  loading: 'Se importă utilizatorii...'
                }
              },
              'description-file-not-selected':
                'Importă utilizatorii dintr-un fișier Excel.',
              'description-file-selected':
                'Importă {count, plural, =1 {un utilizator} other {# de utilizatori}} din fișierul <filename></filename>.',

              form: {
                fields: {
                  email: {
                    label: 'Adresa de e-mail',
                    placeholder: 'Adresa de e-mail utilizatorului'
                  },
                  firstName: {
                    label: 'Prenume',
                    placeholder: 'Prenume utilizatorului'
                  },
                  lastName: {
                    label: 'Nume',
                    placeholder: 'Nume utilizatorului'
                  },
                  phoneNumber: {
                    label: 'Număr de telefon',
                    placeholder: 'Număr de telefon utilizatorului'
                  }
                },
                legend: 'Utilizatorul {index}'
              },

              response: {
                error: {
                  description:
                    'A apărut o eroare la importarea utilizatorilor.',
                  title: 'Importare eșuată'
                },
                success: {
                  description:
                    '{count, plural, =1 {Utilizatorul a fost importat cu succes.} other {# de utilizatori au fost importați cu succes.}}',
                  title: 'Importare reușită'
                }
              },
              title: 'Importă utilizatori'
            },

            'promote-user-dialog': {
              buttons: {
                cancel: 'Anulează',
                confirm: {
                  default: 'Promotează',
                  loading: 'Se promotează utilizatorul la admin...'
                }
              },
              description:
                'Ești sigur că vrei să promotezi utilizatorul la admin?',

              response: {
                error: {
                  description:
                    'A apărut o eroare la promovarea utilizatorului la admin.',
                  title: 'Promotează eșuată'
                },
                success: {
                  description:
                    'Utilizatorul a fost promovat la admin cu succes.',
                  title: 'Promotează reușită'
                }
              },
              title: 'Promotează utilizatorul la admin'
            },

            'remove-users-dialog': {
              buttons: {
                cancel: 'Anulează',
                confirm: {
                  default: 'Șterge',
                  loading: 'Se șterge utilizatorul...'
                }
              },
              description:
                'Ești sigur că vrei să ștergi {count, plural, =1 {un utilizator} other {# de utilizatori}}? {count, plural, =1 {Acesta va fi eliminat} other {Aceştia vor fi eliminați}} permanent.',

              response: {
                error: {
                  description: 'A apărut o eroare la ștergerea utilizatorului.',
                  title: 'Ștergere eșuată'
                },
                success: {
                  description:
                    '{count, plural, =1 {Utilizatorul a fost șters} other {# de utilizatori au fost șterşi}} cu succes.',
                  title: 'Ștergere reușită'
                }
              },
              title:
                'Șterge {count, plural, =1 {un utilizator} other {# de utilizatori}}'
            },

            'unban-user-dialog': {
              buttons: {
                cancel: 'Anulează',
                confirm: {
                  default: 'Debanează',
                  loading: 'Se debanează utilizatorul...'
                }
              },
              description: 'Ești sigur că vrei să dezbanezi utilizatorul?',

              response: {
                error: {
                  description:
                    'A apărut o eroare la dezbanarea utilizatorului.',
                  title: 'Debaneare eșuată'
                },
                success: {
                  description: 'Utilizatorul a fost dezbanat cu succes.',
                  title: 'Debaneare reușită'
                }
              },
              title: 'Debanează utilizatorul'
            },

            'users-table': {
              columns: {
                banExpires: 'Banat până la',
                banned: 'Status ban',
                createdAt: 'Adăugat la',
                email: 'E-mail',
                emailVerified: 'E-mail verificat',
                firstName: 'Prenume',
                id: 'Id',
                invitedBy_name: 'Invitat de',
                lastName: 'Nume',
                name: 'Nume complet',
                phoneNumber: 'Număr de telefon',
                role: 'Rol',
                updatedAt: 'Actualizat la'
              },

              footer: {
                pagination: {
                  'next-page': 'Pagina următoare',
                  'page-count': 'Pagina {page} din {pageCount}',
                  'previous-page': 'Pagina anterioară',
                  'rows-per-page': 'Rânduri pe pagină'
                }
              },
              header: {
                actions: {
                  title: 'Acțiuni',
                  values: {
                    'create-user': 'Adaugă utilizator',
                    'export-users': 'Exportă utilizatori',
                    'import-users': 'Importă utilizatori',
                    'remove-users': 'Șterge utilizatori'
                  }
                },

                columns: { title: 'Coloane' },
                input: {
                  placeholder: 'Caută utilizator...'
                },

                show: {
                  groups: {
                    admins: {
                      title: 'Admini',
                      values: {
                        all: 'Toți',
                        'only-admins': 'Doar admini',
                        'without-admins': 'Fara admin'
                      }
                    },
                    banned: {
                      title: 'Banați',
                      values: {
                        all: 'Toți',
                        'not-banned': 'Nu sunt banati',
                        'only-banned': 'Doar banați'
                      }
                    },
                    'invited-by': {
                      title: 'Invitat de',
                      values: {
                        all: 'Oricine',
                        'by-me': 'De mine'
                      }
                    }
                  },
                  title: 'Afișează'
                }
              },

              row: {
                actions: {
                  'ban-user': 'Banează utilizatorul',
                  'demote-to-user': 'Demotează la user',
                  'edit-user': 'Modifică utilizatorul',
                  'promote-to-admin': 'Promotează la admin',
                  'remove-user': 'Șterge utilizatorul',
                  'unban-user': 'Debanează utilizatorul'
                },

                banned: {
                  values: {
                    banned: 'Este banat',
                    'not-banned': 'Nu este banat'
                  }
                },

                emailVerified: {
                  values: {
                    false: 'Neverificat',
                    true: 'Verificat'
                  }
                },

                'no-results': 'Nu s-au găsit utilizatori.',

                role: {
                  values: {
                    [UserRoles.USER]: 'Reprezentant sales',
                    [UserRoles.ADMIN]: 'Admin',
                    [UserRoles.SUPER_ADMIN]: 'Super admin'
                  }
                }
              }
            }
          }
        }
      },

      checkout: {
        _components: {
          'checkout-form': {
            buttons: {
              'next-step': 'Pasul următor',
              'previous-step': 'Pasul anterior',
              submit: {
                default: 'Platește',
                loading: 'Se plătește...'
              }
            },
            steps: {
              [CheckoutFormStep.BillingInfo]: {
                description: 'Informațele utilizate pentru facturare.',
                forms: {
                  [CheckoutFormSection.Address]: {
                    fields: {
                      city: {
                        placeholder: 'Introduceți orașul',
                        title: 'Oraș'
                      },
                      country: {
                        placeholder: 'Introduceți țara',
                        title: 'Țară'
                      },
                      line1: {
                        placeholder: 'Introduceți numărul și strada',
                        title: 'Număr și stradă'
                      },
                      line2: {
                        placeholder: 'Introduceți blocul și scara',
                        title: 'Bloc și scară'
                      },
                      postal_code: {
                        placeholder: 'Introduceți codul poștal',
                        title: 'Cod poștal'
                      },
                      state: {
                        placeholder: 'Introduceți județul',
                        title: 'Județ'
                      }
                    },
                    legend: 'Adresă de facturare'
                  },
                  [CheckoutFormSection.PersonalDetails]: {
                    fields: {
                      email: {
                        placeholder: 'Introduceți email-ul',
                        title: 'Email'
                      },
                      name: {
                        placeholder: 'Introduceți numele',
                        title: 'Nume'
                      },
                      phoneNumber: {
                        placeholder: 'Introduceți numărul de telefon',
                        title: 'Număr de telefon'
                      }
                    },
                    legend: 'Informații Personale'
                  }
                },
                title: 'Date de facturare'
              },
              [CheckoutFormStep.PaymentMethod]: {
                description: 'Modalitatea de plată utilizată.',
                forms: {
                  'payment-submit': {
                    legend: 'Plateste'
                  }
                },
                title: 'Modalitate de plată'
              },
              [CheckoutFormStep.Confirmation]: {
                description: 'Confirmați detaliile până la finalul plătii.',
                forms: {
                  'verify-details': {
                    description: 'Verifică detaliile până la finalul plătii.',
                    legend: 'Verifică detaliile'
                  }
                },
                title: 'Confirmați detaliile'
              }
            }
          }
        },
        callback: {
          close: 'Puteți închide aceasta paginǎ.',
          title: 'Plata in valoare de {paidAmount} a fost efectuata cu succes!'
        }
      },
      layout: {
        container: {
          sidebar: {
            content: {
              navigation: {
                '(admin)': {
                  routes: {
                    constants: {
                      title: 'Valori constante'
                    },
                    products: {
                      routes: {
                        '[productId]': {
                          routes: {
                            edit: {
                              title: 'Modifică produs'
                            }
                          }
                        },
                        create: {
                          title: 'Adaugă produs'
                        }
                      },
                      title: 'Produse'
                    },
                    settings: {
                      title: 'Setări'
                    },
                    users: {
                      title: 'Utilizatori'
                    }
                  },
                  title: 'Administrator'
                },
                home: {
                  title: 'Pagina principală'
                },
                memberships: {
                  title: 'Membership-uri'
                },
                orders: {
                  title: 'Comenzi'
                },
                'payment-links': {
                  groupTitle: 'Link-uri de plată',
                  routes: {
                    create: { title: 'Adaugă link de plată' }
                  },
                  title: 'Vezi link-urile de plată'
                },
                subscriptions: {
                  title: 'Subscripții'
                }
              }
            },
            footer: {
              'account-management-dialog': {
                description: 'Actualizează datele contului tău.',
                response: {
                  error: {
                    description:
                      'A apărut o eroare la schimbarea datele contului.',
                    title: 'Schimbarea datele contului eșuată'
                  },
                  success: {
                    description: {
                      default: 'Datele contului au fost actualizate cu succes.',
                      'email-verification-sent':
                        'Datele contului au fost actualizate cu succes. Pentru a finaliza actualizarea email-ului, verificați inbox-ul dumneavoastră pentru un link de verificare.'
                    },
                    title: {
                      default: 'Datele au fost actualizate cu succes.',
                      'email-verification-sent':
                        'Datele au fost actualizate cu succes și verificarea email-ului a fost trimisă.'
                    }
                  }
                },
                title: 'Administrează datele contului tău.',
                'update-user-form': {
                  buttons: {
                    cancel: 'Anulează',
                    submit: {
                      default: 'Schimbă datele contului',
                      loading: 'Se schimbă datele contului...'
                    }
                  },
                  fields: {
                    email: {
                      description:
                        'Adresa de e-mail utilizată pentru autentificare.',
                      placeholder: 'Introduceți adresa de e-mail',
                      title: 'Adresa de e-mail'
                    },
                    firstName: {
                      placeholder: 'Introduceți prenumele nou',
                      title: 'Prenume'
                    },
                    lastName: {
                      placeholder: 'Introduceți numele nou',
                      title: 'Nume'
                    },
                    phoneNumber: {
                      placeholder: 'Introduceți numărul de telefon nou',
                      title: 'Număr de telefon'
                    }
                  }
                }
              },
              dropdown: {
                'account-management': 'Administrare cont',
                'sign-out': 'Deconectare',
                theme: {
                  title: 'Temă vizuală',
                  values: {
                    dark: 'Întunecată',
                    light: 'Luminoasă',
                    system: 'Sistem'
                  }
                }
              },
              'sign-out-dialog': {
                buttons: {
                  cancel: 'Anulează',
                  submit: {
                    default: 'Deconectare',
                    loading: 'Se deconectează...'
                  }
                },
                description:
                  'Ești sigur că vrei să te deconectezi? Va trebui să te autentifici din nou pentru a reintra în cont.',

                response: {
                  error: {
                    description:
                      'A apărut o eroare la deconectarea dumneavoastră.',
                    title: 'Deconectare eșuată'
                  },
                  success: {
                    description: 'Ați fost deconectat cu succes.',
                    title: 'Deconectarea a reușit'
                  }
                },
                title: 'Deconectare'
              }
            }
          }
        }
      },
      memberships: {
        _components: {
          'manage-linked-subscriptions-dialog': {
            buttons: {
              cancel: 'Anulează',
              link: 'Leagă subscripție',
              unlink: 'Dezleagă'
            },
            description: {
              default: 'Gestionează subscripțile legate de acest membership.',
              'with-customer':
                'Gestionează subscripțile pentru membership-ul lui {customerName}.'
            },
            fields: {
              'subscription-search': {
                empty: 'Nicio subscripție disponibilă',
                label: 'Caută subscripție',
                placeholder: 'Caută după ID...'
              }
            },
            sections: {
              'link-new': {
                title: 'Leagă subscripție nouă'
              },
              linked: {
                empty: 'Nicio subscripție legată de acest membership',
                'extension-subscriptions': 'Subscripții prelungiri',
                'product-subscriptions': 'Subscripții produse',
                title: 'Subscripții legate actuale'
              }
            },
            'subscription-item': {
              id: 'ID: {id}',
              status: 'Status: {status}'
            },
            title: 'Gestionează subscripții legate',
            toast: {
              link: {
                error: {
                  description: 'A apărut o eroare neașteptată',
                  title: 'Nu s-a putut lega subscripția'
                },
                success: {
                  description: 'Subscripția a fost legată cu succes',
                  title: 'Subscripție legată'
                }
              },
              unlink: {
                error: {
                  description: 'A apărut o eroare neașteptată',
                  title: 'Nu s-a putut dezlega subscripția'
                },
                success: {
                  description: 'Subscripția a fost dezlegată cu succes',
                  title: 'Subscripție dezlegată'
                }
              }
            }
          },
          'memberships-table': {
            columns: {
              createdAt: 'Creat la',
              createdAtValue: 'Creat la (valoare internă)',
              customerEmail: 'Email client',
              customerName: 'Nume client',
              delayedStartDate: 'Data de început întârziată',
              delayedStartDateValue:
                'Data de început întârziată (valoare internă)',
              endDate: 'Data de încheiere',
              endDateValue: 'Data de încheiere (valoare internă)',
              id: 'Id',
              parentOrderId: 'Id comandă',
              productName: 'Nume produs',
              startDate: 'Data de început',
              startDateValue: 'Data de început (valoare internă)',
              status: 'Status',
              statusValue: 'Status (valoare internă)',
              updatedAt: 'Actualizat la',
              updatedAtValue: 'Actualizat la (valoare internă)'
            },
            header: {
              actions: {
                title: 'Acțiuni',
                values: {
                  download: 'Descarcă'
                }
              },
              columns: {
                title: 'Coloane'
              },
              input: {
                placeholder: 'Caută membership'
              },
              show: {
                groups: {
                  status: {
                    title: 'Filtrează după status',
                    values: {
                      active: 'Activ',
                      all: 'Toate',
                      cancelled: 'Anulat',
                      delayed: 'Întârziat',
                      paused: 'Pauză'
                    }
                  }
                },
                title: 'Afișează'
              }
            },
            'no-results': 'Nu s-au găsit membership-uri.',
            pagination: {
              'next-page': 'Pagina următoare',
              'page-count': 'Pagina {page} din {pageCount}',
              'previous-page': 'Pagina anterioară',
              'rows-per-page': 'Rânduri pe pagină'
            },
            row: {
              actions: {
                label: 'Acțiuni',
                'link-subscription': 'Conectează subscripție',
                'transfer-membership': 'Transferă membership',
                'update-dates': 'Actualizează date',
                'update-status': 'Actualizează status'
              },
              status: {
                active: 'Activ',
                cancelled: 'Anulat',
                delayed: 'Întârziat',
                paused: 'Pauză'
              }
            }
          },
          'transfer-membership-dialog': {
            alert: {
              description:
                'Adresa de email țintă trebuie să aibă deja un cont de client existent în sistem. Această acțiune va transfera membership-ul și va actualiza toate subscripțile asociate la noul client.',
              title: 'Important: Clientul trebuie să existe'
            },
            buttons: {
              cancel: 'Anulează',
              submit: {
                default: 'Transferă membership',
                loading: 'Se transferă...'
              }
            },
            'current-customer': 'Client curent:',
            description: {
              default: 'Transferă acest membership la alt client.',
              'with-customer':
                'Transferă membership-ul lui {customerName} la alt client.'
            },
            fields: {
              'new-customer-email': {
                label: 'Email client nou',
                placeholder: 'client.nou@example.com'
              }
            },
            title: 'Transferă Membership',
            toast: {
              error: {
                description: 'A apărut o eroare neașteptată',
                title: 'Nu s-a putut transfera membership-ul'
              },
              success: {
                description:
                  'Membership-ul și toate subscripțile asociate au fost transferate cu succes',
                title: 'Membership transferat'
              }
            }
          },
          'update-dates-dialog': {
            buttons: {
              cancel: 'Anulează',
              submit: {
                default: 'Actualizează date',
                loading: 'Se actualizează...'
              }
            },
            description: {
              default: 'Actualizează datele membership-ului.',
              'with-customer':
                'Actualizează datele pentru membership-ul lui {customerName}.'
            },
            fields: {
              'delayed-start-date': {
                label: 'Data de început întârziată (Opțional)',
                placeholder: 'Selectează data de început întârziată'
              },
              'end-date': {
                label: 'Data de încheiere',
                placeholder: 'Selectează data de încheiere'
              },
              'start-date': {
                label: 'Data de început',
                placeholder: 'Selectează data de început'
              }
            },
            title: 'Actualizează Datele Membership-ului',
            toast: {
              error: {
                description: 'A apărut o eroare neașteptată',
                title: 'Nu s-au putut actualiza datele membership-ului'
              },
              success: {
                description:
                  'Datele membership-ului au fost actualizate cu succes',
                title: 'Date membership actualizate'
              }
            }
          },
          'update-status-dialog': {
            alert: {
              description:
                'Statusul "Pauză" poate fi setat doar automat când un subscripție conectat eșuează la plată de 3 ori. Modificările manuale ale statusului membership-ului nu afectează subscripția.',
              title: 'Notă: Status-ul Pauză este gestionat de sistem'
            },
            buttons: {
              cancel: 'Anulează',
              submit: {
                default: 'Actualizează status',
                loading: 'Se actualizează...'
              }
            },
            'current-status': 'Status curent:',
            description: {
              default: 'Schimbă statusul membership-ului.',
              'with-customer':
                'Schimbă statusul pentru membership-ul lui {customerName}.'
            },
            fields: {
              status: {
                label: 'Status membership',
                options: {
                  active: 'Activ',
                  cancelled: 'Anulat',
                  delayed: 'Întârziat'
                },
                placeholder: 'Selectează status'
              }
            },
            title: 'Actualizează Status Membership',
            toast: {
              error: {
                description: 'A apărut o eroare neașteptată',
                title: 'Nu s-a putut actualiza statusul membership-ului'
              },
              success: {
                description:
                  'Statusul membership-ului a fost schimbat în {status}',
                title: 'Status membership actualizat'
              }
            }
          }
        }
      },
      orders: {
        _components: {
          'create-payment-form': {
            buttons: {
              submit: {
                default: 'Crează link de plată',
                loading: 'Se crează link de plată...'
              }
            },

            'deposit-payment': {
              'bank-transfer-deposit-payment-description':
                '<bold>Pentru transfer bancar:</bold> se genereaza direct ordin on-hold dupa maxim {daysCount, plural, =1 {o zi} other {# de zile}}.',
              'card-deposit-payment-description':
                '<bold>Plata cu cardul:</bold> Se debiteaza direct dupa maxim {daysCount, plural, =1 {o zi} other {# de zile}}.',
              'deposit-payment-description1':
                '* Pentru plata avansului care deblocheaza accesul la program, pretul s-a calculat astfel: 1 EUR = {eurToRonRate}. Asadar, {minDepositAmount} = <bold>{calculatedMinDepositAmount}+tva</bold> (suma mimima ce trebuie incasata ca omul sa primeasca acces si la platforma si la mentor). Asigura-te că-i transmiti clientului sa aiba pe card o suma mai mare decat suma stabilita ca avans/rata/integral pentru ca pot interveni diverse comisioane bancare sau taxe extra.',
              'deposit-payment-description2':
                '<bold>ATENTIE!</bold> In cazul in care clientul achita o suma de avans mai mica de <bold>{calculatedMinDepositAmount}+tva</bold> primeste acces doar la grupurile de Facebook si WhatsApp (acolo unde exista).',
              description:
                'Daca optiunea de avans a fost activata, plata pentru avans se face inainte de a intra pe un plan de plati.',

              fields: {
                input: {
                  description: 'Suma care va fi plătită prima oară',
                  placeholder: 'Introduceți suma avans',
                  title: 'Suma avans'
                },
                select: {
                  title: 'Data primei plati',
                  value:
                    'În maxim {daysCount, plural, =1 {o zi} other {# zile}} card/transfer bancar'
                },
                switch: {
                  title: 'Activează plata în avans'
                }
              },
              legend: 'Platǎ Avans'
            },

            'pay-in-installments': {
              description:
                'Daca optiunea de platǎ în rate a fost activata, plata se face în rate.',

              fields: {
                select: {
                  description: 'Alege opțiunea de rate pentru produs.',
                  placeholder: 'Selecteazǎ opțiunea de rate',
                  title: 'Alege opțiunea de rate',
                  value:
                    '{installments} rate <muted>({installments} x {pricePerInstallment} = {totalPrice})</muted>'
                },
                switch: {
                  title: 'Activează platǎ în rate'
                }
              },
              legend: 'Platǎ în rate'
            },
            response: {
              error: {
                description: 'A apărut o eroare la crearea link-ului de plată.',
                title: 'Link-ul de plată nu a fost creat'
              },
              success: {
                description: 'Comanda a fost creată cu succes.',
                title: 'Link-ul de plată a fost creat'
              }
            },
            'select-product-and-scheduledEvent': {
              description:
                'Alege un produs și o întâlnire pentru care se va crea link-ul de plată.',

              fields: {
                'product-select': {
                  placeholder: 'Selecteazǎ un produs',
                  title: 'Alege un produs'
                },
                'scheduledEvent-select': {
                  placeholder: 'Cautǎ o întâlnire',
                  title: 'Alege o întâlnire',
                  values: {
                    'not-found': 'Nu s-a gǎsit nicio întâlnire',
                    placeholder: 'Cautǎ o întâlnire',
                    status: {
                      active: 'Activǎ',
                      canceled: 'Anulatǎ'
                    }
                  }
                }
              },
              legend: 'Alege un produs și o întâlnire'
            },

            summary: {
              'amount-to-pay': 'Suma de plată',
              'installments-cycle': 'Ciclu facturi',
              'installments-cycle-value':
                'La {count, plural, =1 {o lunǎ} other {# luni}}',
              'payment-with-deposit': '1 (avansul)',
              'payments-count': 'Număr de plăți',
              'payments-count-with-deposit': '{count} (+ avans)'
            }
          },
          'orders-table': {
            columns: {
              createdAt: 'Creat la',
              customerEmail: 'Email client',
              customerName: 'Nume client',
              id: 'Id',
              paymentLinkId: 'Id link de plată',
              paymentProductType: 'Tip produs',
              paymentProductTypeValues: {
                [PaymentProductType.Product]: 'Produs',
                [PaymentProductType.Extension]: 'Prelungire'
              },
              productName: 'Nume produs',
              status: 'Status',
              statusValues: {
                [OrderStatusType.Completed]: 'Completatǎ',
                [OrderStatusType.PendingBankTransferPayment]:
                  'În așteptare transfer bancar',
                [OrderStatusType.ProcessingBankTransferPayment]:
                  'În procesare transfer bancar',
                [OrderStatusType.PendingCardPayment]: 'În așteptare card',
                [OrderStatusType.Cancelled]: 'Anulatǎ'
              },
              stripePaymentIntentId: 'Id Stripe',
              type: 'Tip',
              typeValues: {
                [OrderType.ParentOrder]: 'Comandă principalǎ',
                [OrderType.OneTimePaymentOrder]: 'Comandǎ integralǎ',
                [OrderType.RenewalOrder]: 'Comandǎ de reînnoire'
              },
              updatedAt: 'Actualizat la'
            },
            header: {
              actions: {
                title: 'Acțiuni',
                values: {
                  download: 'Descarcă'
                }
              },
              columns: {
                title: 'Coloane'
              },
              input: {
                placeholder: 'Caută comandă'
              },
              show: {
                groups: {
                  'created-by': {
                    title: 'Create de utilizator',
                    values: {
                      all: 'Toate',
                      'by-me': 'Create de mine'
                    }
                  },
                  'payment-product-type': {
                    title: 'Tip produs',
                    values: {
                      all: 'Toate',
                      [PaymentProductType.Product]: 'Produs',
                      [PaymentProductType.Extension]: 'Prelungire'
                    }
                  },
                  status: {
                    title: 'Status',
                    values: {
                      all: 'Toate',
                      [OrderStatusType.Completed]: 'Completatǎ',
                      [OrderStatusType.PendingBankTransferPayment]:
                        'În așteptare transfer bancar',
                      [OrderStatusType.ProcessingBankTransferPayment]:
                        'În procesare transfer bancar',
                      [OrderStatusType.PendingCardPayment]: 'În așteptare card',
                      [OrderStatusType.Cancelled]: 'Anulatǎ'
                    }
                  },
                  type: {
                    title: 'Tip comandǎ',
                    values: {
                      all: 'Toate',
                      [OrderType.ParentOrder]: 'Comandă principalǎ',
                      [OrderType.OneTimePaymentOrder]: 'Comandǎ integralǎ',
                      [OrderType.RenewalOrder]: 'Comandǎ de reînnoire'
                    }
                  }
                },
                title: 'Afișează'
              }
            },
            'no-results': 'Nu s-au găsit comenzi.',
            pagination: {
              'next-page': 'Pagina următoare',
              'page-count': 'Pagina {page} din {pageCount}',
              'previous-page': 'Pagina anterioară',
              'rows-per-page': 'Rânduri pe pagină'
            },
            row: {
              actions: {
                values: {
                  'cancel-order': {
                    extension: {
                      response: {
                        error: {
                          description:
                            'A apărut o eroare la anularea comandei prelungirii.',
                          title: 'Anulează comandă prelungire'
                        },
                        success: {
                          description:
                            'Comanda prelungirii a fost anulată cu succes.',
                          title: 'Anulează comandă prelungire'
                        }
                      }
                    },
                    product: {
                      response: {
                        error: {
                          description:
                            'A apărut o eroare la anularea comandei produsului.',
                          title: 'Anulează comandă produs'
                        },
                        success: {
                          description:
                            'Comanda produsului a fost anulată cu succes.',
                          title: 'Anulează comandă produs'
                        }
                      }
                    },
                    title: 'Anulează comandă'
                  },
                  'process-bank-transfer-payment': {
                    title: 'Procesează transfer bancar'
                  }
                }
              },
              paymentMethod: {
                [PaymentMethodType.Card]: 'Card',
                [PaymentMethodType.BankTransfer]: 'Transfer bancar',
                [PaymentMethodType.TBI]: 'TBI'
              },
              status: {
                [OrderStatusType.Completed]: 'Completatǎ',
                [OrderStatusType.PendingBankTransferPayment]:
                  'În așteptare transfer bancar',
                [OrderStatusType.PendingCardPayment]: 'În așteptare card',
                [OrderStatusType.Cancelled]: 'Anulatǎ'
              },
              type: {
                [OrderType.ParentOrder]: 'Comandă principalǎ',
                [OrderType.OneTimePaymentOrder]: 'Comandǎ integralǎ',
                [OrderType.RenewalOrder]: 'Comandǎ de reînnoire'
              }
            }
          }
        }
      },

      'payment-links': {
        _components: {
          'create-extension-payment-link-form': {
            buttons: {
              'next-step': 'Pasul următor',
              'previous-step': 'Pasul anterior',
              submit: { default: 'Generează', loading: 'Se generează...' }
            },
            response: {
              error: {
                description: 'A apărut o eroare la crearea link-ului de plată.',
                title: 'Link-ul de plată nu a fost creat'
              },
              success: {
                description: 'Link-ul de plată a fost creat cu succes.',
                title: 'Link-ul de plată a fost creat'
              }
            },

            steps: {
              [CreateExtensionPaymentLinkFormStep.BaseInfo]: {
                description:
                  'Configurați detaliile de bazǎ pentru crearea link-ului de platǎ.',
                forms: {
                  [CreateExtensionPaymentLinkFormSection.Extension]: {
                    description:
                      'Alege o prelungire pentru care se va crea link-ul de plată.',
                    fields: {
                      extensionId: {
                        item: {
                          extensionMonths:
                            '{extensionMonths, plural, =1 {o lunǎ} other {# luni}}',
                          formattedPrice: '({formattedPrice} fǎrǎ TVA)'
                        },
                        placeholder: 'Selecteazǎ o prelungire',
                        title: 'Alege o prelungire'
                      },
                      membershipId: {
                        placeholder: 'Selecteazǎ un membership',
                        title: 'Alege un membership',
                        values: {
                          'not-found': 'Nu s-a gǎsit nici un membership',
                          placeholder: 'Cautǎ un membership',
                          status: {
                            [MembershipStatusType.Active]: 'Activǎ',
                            [MembershipStatusType.Cancelled]: 'Anulatǎ',
                            [MembershipStatusType.Delayed]: 'Intarziatǎ',
                            [MembershipStatusType.Paused]: 'Pauzǎ'
                          }
                        }
                      }
                    },
                    legend: 'Prelungire'
                  },
                  [CreateProductPaymentLinkFormSection.Participants]: {
                    description:
                      'Alege participanții pentru care se va crea link-ul de plată.',
                    fields: {
                      callerEmail: {
                        placeholder: 'Introduceți email-ul caller-ului',
                        title: 'Email caller'
                      },
                      callerName: {
                        placeholder: 'Introduceți numele caller-ului',
                        title: 'Nume caller'
                      },
                      closerEmail: {
                        placeholder: 'Introduceți email-ul closer-ului',
                        title: 'Email closer'
                      },
                      closerName: {
                        placeholder: 'Introduceți numele closer-ului',
                        title: 'Nume closer'
                      },
                      setterEmail: {
                        placeholder: 'Introduceți email-ul setter-ului',
                        title: 'Email setter'
                      },
                      setterName: {
                        placeholder: 'Introduceți numele setter-ului',
                        title: 'Nume setter'
                      }
                    },
                    legend: 'Participanți'
                  },
                  [CreateProductPaymentLinkFormSection.Product]: {
                    description:
                      'Alege un produs pentru care se va crea link-ul de plată.',
                    fields: {
                      contractId: {
                        placeholder: 'Selecteazǎ un contract',
                        title: 'Alege un contract'
                      },
                      extensionId: {
                        item: {
                          extensionMonths:
                            '{extensionMonths, plural, =1 {o lunǎ} other {# luni}}',
                          formattedPrice: '({formattedPrice} fǎrǎ TVA)'
                        },
                        placeholder: 'Selecteazǎ o prelungire',
                        title: 'Alege o prelungire'
                      },
                      productId: {
                        item: {
                          formattedPrice: '({formattedPrice} fǎrǎ TVA)'
                        },
                        placeholder: 'Selecteazǎ un produs',
                        title: 'Alege un produs'
                      },
                      productType: {
                        placeholder: 'Selecteazǎ tipul produsului',
                        title: 'Tip produs',
                        values: {
                          [PaymentProductType.Product]: 'Produs de bazǎ',
                          [PaymentProductType.Extension]: 'Prelungire'
                        }
                      }
                    },
                    legend: 'Produs'
                  }
                },
                title: 'Detalii de bazǎ'
              },
              [CreateExtensionPaymentLinkFormStep.PaymentInfo]: {
                description:
                  'Configurați detaliile de platǎ pentru crearea link-ului.',
                forms: {
                  [CreateExtensionPaymentLinkFormSection.PaymentInfo]: {
                    description:
                      'Alege țara de facturare și metoda de platǎ pentru crearea link-ului.',
                    fields: {
                      paymentMethodType: {
                        item: {
                          [PaymentMethodType.BankTransfer]: 'Transfer bancar',
                          [PaymentMethodType.Card]: 'Card',
                          [PaymentMethodType.TBI]: 'TBI'
                        },
                        placeholder: 'Selecteazǎ metoda de platǎ',
                        title: 'Metoda de platǎ'
                      },
                      paymentSettingId: {
                        itemDetails:
                          '<muted>Monedǎ: <bold>{currency}</bold> TVA: <bold>{tvaRate}%</bold> Comision extra: <bold>{extraTaxRate}%</bold></muted>',
                        placeholder: 'Selecteazǎ o setare de platǎ',
                        title: 'Setare de platǎ'
                      }
                    },
                    legend: 'Detalii platǎ'
                  },
                  [CreateExtensionPaymentLinkFormSection.Installments]: {
                    description: {
                      default:
                        'Alege opțiunile de rate pentru crearea link-ului de plată.',
                      'disabled-no-installments':
                        'Nu există opțiuni de rate pentru <bold>prelungirea de {extensionMonths, plural, =1 {o lunǎ} other {# luni}}</bold> a produsului <bold>{productName}</bold>',
                      'disabled-payment-method-tbi':
                        'Nu există opțiuni de rate pentru <bold>plata prin TBI</bold>.'
                    },
                    fields: {
                      extensionInstallmentId: {
                        item: {
                          count: '{count, plural, =1 {o ratǎ} other {# rate}}',
                          formattedPrice:
                            '({count} x {formattedPrice} = {formattedTotalPrice} farǎ TVA)'
                        },
                        placeholder:
                          'Selecteazǎ opțiunea de rate pentru prelungire',
                        title: 'Alege opțiunea de rate pentru prelungire'
                      },
                      hasInstallments: {
                        title: 'Activează rate'
                      }
                    },
                    legend: 'Opțiuni de rate'
                  },
                  [CreateExtensionPaymentLinkFormSection.Deposit]: {
                    description: {
                      default:
                        'Alege opțiunile de avans pentru crearea link-ului de plată.',
                      'disabled-no-deposit':
                        'Nu există opțiunea de avans pentru <bold>prelungirea de {extensionMonths, plural, =1 {o lunǎ} other {# luni}}</bold> a produsului <bold>{productName}</bold>',
                      'disabled-payment-method-tbi':
                        'Nu există opțiunea de avans pentru <bold>plata prin TBI</bold>.'
                    },
                    fields: {
                      depositAmount: {
                        placeholder: 'Introduceți suma pentru avans',
                        title:
                          'Suma pentru avans ({tvaRate, plural, =0 {farǎ TVA} other {cu #% TVA}})',
                        warning: {
                          max: {
                            [PaymentCurrencyType.EUR]:
                              '<bold>ATENTIE!</bold> Suma selectata este <bold>mai mare sau egalǎ</bold> decat <bold>{formattedPriceInEUR}</bold> {tvaRate, plural, =0 {farǎ <bold>TVA</bold>} other {cu <bold>#% TVA</bold>}}, prețul întreg al produsului.',
                            [PaymentCurrencyType.RON]:
                              '<bold>ATENTIE!</bold> Suma selectata este <bold>mai mare sau egalǎ</bold> decat <bold>{formattedPriceInRON}</bold> (<bold>{formattedPriceInEUR}</bold> {tvaRate, plural, =0 {farǎ <bold>TVA</bold>} other {cu <bold>#% TVA</bold>}} calculat la <bold>{formattedEUR}</bold> = <bold>{formattedEURToRONRate}</bold>), prețul întreg al produsului.'
                          },
                          min: {
                            [PaymentCurrencyType.EUR]:
                              '<bold>ATENTIE!</bold> Suma selectata este <bold>mai mica</bold> decat <bold>{formattedMinDepositAmountEUR}</bold> ({tvaRate, plural, =0 {farǎ <bold>TVA</bold>} other {cu <bold>#% TVA</bold>}}) minimul pe care trebuie sa-l achite un client ca sa primeasca acces la platforma de curs si la mentor. <bold>Asigura-te ca-l anunti si stie aceste lucruri.</bold>',
                            [PaymentCurrencyType.RON]:
                              '<bold>ATENTIE!</bold> Suma selectata este <bold>mai mica</bold> decat <bold>{formattedMinDepositAmountRON}</bold> (<bold>{formattedMinDepositAmountEUR}</bold> {tvaRate, plural, =0 {farǎ <bold>TVA</bold>} other {cu <bold>#% TVA</bold>}} calculat la <bold>{formattedEUR}</bold> = <bold>{formattedEURToRONRate}</bold>) minimul pe care trebuie sa-l achite un client ca sa primeasca acces la platforma de curs si la mentor. <bold>Asigura-te ca-l anunti si stie aceste lucruri.</bold>'
                          }
                        }
                      },
                      firstPaymentDateAfterDepositOptionId: {
                        info: {
                          [PaymentMethodType.BankTransfer]:
                            '<bold>Pentru transfer bancar:</bold> se genereaza direct ordin on-hold{daysCount, plural, =0 {.} =1 { dupa maxim o zi.} other { dupa maxim # de zile.}}',
                          [PaymentMethodType.Card]:
                            '<bold>Plata cu cardul:</bold> Se debiteaza direct{daysCount, plural, =0 {.} =1 { dupa maxim o zi.} other { dupa maxim # de zile.}}'
                        },
                        placeholder: 'Selecteazǎ data primei plati',
                        title: 'Data primei plati',
                        value:
                          'În maxim {daysCount, plural, =1 {o zi} other {# zile}} card/transfer bancar'
                      },
                      hasDeposit: {
                        title: 'Activează plata avans'
                      }
                    },
                    info: {
                      notice: {
                        [PaymentCurrencyType.EUR]:
                          'Asigura-te că-i transmiti clientului sa aiba pe card o suma mai mare decat suma stabilita ca avans/rata/integral pentru ca pot interveni diverse comisioane bancare sau taxe extra.',
                        [PaymentCurrencyType.RON]:
                          'Pentru plata avansului care deblocheaza accesul la program, pretul s-a calculat astfel: 1 EUR = {eurToRonRate}. Asadar, {formattedMinDepositAmountEUR} = <bold>{formattedMinDepositAmountRON} cu TVA</bold> (suma mimima ce trebuie incasata ca omul sa primeasca acces si la platforma si la mentor). Asigura-te că-i transmiti clientului sa aiba pe card o suma mai mare decat suma stabilita ca avans/rata/integral pentru ca pot interveni diverse comisioane bancare sau taxe extra.'
                      },
                      warning:
                        '<bold>ATENTIE!</bold> In cazul in care clientul achita o suma de avans mai mica de <bold>{formattedMinDepositAmountEUR} cu TVA</bold> primeste acces doar la grupurile de Facebook si WhatsApp (acolo unde exista).'
                    },
                    legend: 'Opțiunea de avans'
                  }
                },
                title: 'Configurare platǎ'
              },
              [CreateExtensionPaymentLinkFormStep.Confirmation]: {
                description:
                  'Confirmați detaliile pentru crearea link-ului de plată.',
                sections: {
                  deposit: {
                    items: {
                      'deposit-amount': 'Suma avansului',
                      'first-payment-after-deposit': 'Prima platǎ dupa avans',
                      'first-payment-date-after-deposit':
                        'Data primei plati dupa avans'
                    },
                    title: 'Opțiuni de rate'
                  },
                  installments: {
                    items: {
                      'installment-count': 'Număr rate',
                      'installment-price': 'Preț per rată (fără TVA)',
                      'installment-total-price': 'Preț total (fără TVA)'
                    },
                    title: 'Opțiuni de rate'
                  },
                  participants: {
                    items: {
                      'caller-name': 'Nume caller',
                      client: 'Client',
                      closer: 'Closer',
                      'setter-name': 'Nume setter'
                    },
                    title: 'Participanți'
                  },
                  payment: {
                    items: {
                      'deposit-amount': 'Suma avans (cu TVA)',
                      'installment-amount-to-pay':
                        'Suma de platǎ per rată (cu TVA)',
                      'installments-count': 'Număr rate',
                      'remaining-amount-to-pay':
                        'Suma rǎmasǎ de platǎ (cu TVA)',
                      'remaining-amount-to-pay-per-installment':
                        'Suma rǎmasǎ de platǎ per rata (cu TVA)',
                      'total-amount-to-pay': 'Suma totalǎ de platǎ (cu TVA)'
                    },
                    title: 'Platǎ'
                  },
                  'payment-info': {
                    items: {
                      currency: 'Monedǎ',
                      'extra-tax-rate': 'Comision extra',
                      'payment-method': 'Metoda de platǎ',
                      'payment-method-values': {
                        [PaymentMethodType.BankTransfer]: 'Transfer bancar',
                        [PaymentMethodType.Card]: 'Card',
                        [PaymentMethodType.TBI]: 'TBI'
                      },
                      'payment-setting-label': 'Setare de platǎ',
                      'tva-rate': 'TVA'
                    },
                    title: 'Detalii platǎ'
                  },
                  product: {
                    items: {
                      contract: 'Contract',
                      'product-name': 'Nume produs',
                      'product-price': 'Preț produs (fără TVA)'
                    },
                    title: 'Produs'
                  }
                },
                title: 'Confirmați detaliile'
              },
              [CreateExtensionPaymentLinkFormStep.Success]: {
                buttons: {
                  copy: { copied: 'Link copiat', copy: 'Copiază link' },
                  'go-to-payment-links': 'Vezi link-urile de plată',
                  'start-again': 'Începe din nou'
                },
                description:
                  'Link-ul de plată a fost creat cu succes. Acum poți partaja clientului link-ul de plată.',
                title: 'Link-ul de plată a fost creat'
              }
            }
          },
          'create-payment-link-form': {
            tabs: {
              [PaymentProductType.Extension]: 'Prelungire',
              [PaymentProductType.Product]: 'Produs'
            }
          },
          'create-product-payment-link-form': {
            buttons: {
              'next-step': 'Pasul următor',
              'previous-step': 'Pasul anterior',
              submit: { default: 'Generează', loading: 'Se generează...' }
            },
            response: {
              error: {
                description: 'A apărut o eroare la crearea link-ului de plată.',
                title: 'Link-ul de plată nu a fost creat'
              },
              success: {
                description: 'Link-ul de plată a fost creat cu succes.',
                title: 'Link-ul de plată a fost creat'
              }
            },

            steps: {
              [CreateProductPaymentLinkFormStep.BaseInfo]: {
                forms: {
                  [CreateProductPaymentLinkFormSection.Participants]: {
                    description:
                      'Alege participanții pentru care se va crea link-ul de plată.',
                    fields: {
                      callerEmail: {
                        placeholder: 'Introduceți email-ul caller-ului',
                        title: 'Email caller'
                      },
                      callerName: {
                        placeholder: 'Introduceți numele caller-ului',
                        title: 'Nume caller'
                      },
                      scheduledEventId: {
                        placeholder: 'Cautǎ o întâlnire',
                        title: 'Alege o întâlnire',
                        values: {
                          client: 'Client:',
                          closer: 'Closer:',
                          'not-found': 'Nu s-a gǎsit nicio întâlnire',
                          placeholder: 'Introduceți cel puțin 3 caractere',
                          status: {
                            active: 'Activǎ',
                            canceled: 'Anulatǎ'
                          },
                          'type-to-search':
                            'Introduceți cel puțin 3 caractere pentru a căuta o întâlnire'
                        }
                      },
                      setterEmail: {
                        placeholder: 'Introduceți email-ul setter-ului',
                        title: 'Email setter'
                      },
                      setterName: {
                        placeholder: 'Introduceți numele setter-ului',
                        title: 'Nume setter'
                      }
                    },
                    legend: 'Participanți'
                  },
                  [CreateProductPaymentLinkFormSection.Product]: {
                    description:
                      'Alege un produs pentru care se va crea link-ul de plată.',
                    fields: {
                      contractId: {
                        placeholder: 'Selecteazǎ un contract',
                        title: 'Alege un contract'
                      },
                      extensionId: {
                        item: {
                          extensionMonths:
                            '{extensionMonths, plural, =1 {o lunǎ} other {# luni}}',
                          formattedPrice: '({formattedPrice} fǎrǎ TVA)'
                        },
                        placeholder: 'Selecteazǎ o prelungire',
                        title: 'Alege o prelungire'
                      },
                      productId: {
                        item: {
                          formattedPrice: '({formattedPrice} fǎrǎ TVA)'
                        },
                        placeholder: 'Selecteazǎ un produs',
                        title: 'Alege un produs'
                      },
                      productType: {
                        placeholder: 'Selecteazǎ tipul produsului',
                        title: 'Tip produs',
                        values: {
                          [PaymentProductType.Product]: 'Produs de bazǎ',
                          [PaymentProductType.Extension]: 'Prelungire'
                        }
                      }
                    },
                    legend: 'Produs'
                  }
                },
                title: 'Detalii de bazǎ'
              },
              [CreateProductPaymentLinkFormStep.PaymentInfo]: {
                description:
                  'Configurați detaliile de platǎ pentru crearea link-ului.',
                forms: {
                  [CreateProductPaymentLinkFormSection.PaymentInfo]: {
                    description:
                      'Alege țara de facturare și metoda de platǎ pentru crearea link-ului.',
                    fields: {
                      paymentMethodType: {
                        item: {
                          [PaymentMethodType.BankTransfer]: 'Transfer bancar',
                          [PaymentMethodType.Card]: 'Card',
                          [PaymentMethodType.TBI]: 'TBI'
                        },
                        placeholder: 'Selecteazǎ metoda de platǎ',
                        title: 'Metoda de platǎ'
                      },
                      paymentSettingId: {
                        itemDetails:
                          '<muted>Monedǎ: <bold>{currency}</bold> TVA: <bold>{tvaRate}%</bold> Comision extra: <bold>{extraTaxRate}%</bold></muted>',
                        placeholder: 'Selecteazǎ o setare de platǎ',
                        title: 'Setare de platǎ'
                      }
                    },
                    legend: 'Detalii platǎ'
                  },
                  [CreateProductPaymentLinkFormSection.Installments]: {
                    description: {
                      default:
                        'Alege opțiunile de rate pentru crearea link-ului de plată.',
                      'disabled-no-installments':
                        'Nu există opțiuni de rate pentru produsul',
                      'disabled-payment-method-tbi':
                        'Nu există opțiuni de rate pentru <bold>plata prin TBI</bold>.'
                    },
                    fields: {
                      extensionInstallmentId: {
                        item: {
                          count: '{count, plural, =1 {o ratǎ} other {# rate}}',
                          formattedPrice:
                            '({count} x {formattedPrice} = {formattedTotalPrice} farǎ TVA)'
                        },
                        placeholder:
                          'Selecteazǎ opțiunea de rate pentru prelungire',
                        title: 'Alege opțiunea de rate pentru prelungire'
                      },
                      hasInstallments: {
                        title: 'Activează rate'
                      },
                      productInstallmentId: {
                        item: {
                          count: '{count, plural, =1 {o ratǎ} other {# rate}}',
                          formattedPrice:
                            '({count} x {formattedPrice} = {formattedTotalPrice} farǎ TVA)'
                        },
                        placeholder:
                          'Selecteazǎ opțiunea de rate pentru produs',
                        title: 'Alege opțiunea de rate pentru produs'
                      }
                    },
                    legend: 'Opțiuni de rate'
                  },
                  [CreateProductPaymentLinkFormSection.Deposit]: {
                    description: {
                      default:
                        'Alege opțiunile de avans pentru crearea link-ului de plată.',
                      'disabled-no-deposit':
                        'Nu există opțiunea de avans pentru produsul',
                      'disabled-payment-method-tbi':
                        'Nu există opțiunea de avans pentru <bold>plata prin TBI</bold>.'
                    },
                    fields: {
                      depositAmount: {
                        placeholder: 'Introduceți suma pentru avans',
                        title:
                          'Suma pentru avans ({tvaRate, plural, =0 {farǎ TVA} other {cu #% TVA}})',
                        warning: {
                          max: {
                            [PaymentCurrencyType.EUR]:
                              '<bold>ATENTIE!</bold> Suma selectata este <bold>mai mare sau egalǎ</bold> decat <bold>{formattedPriceInEUR}</bold> {tvaRate, plural, =0 {farǎ <bold>TVA</bold>} other {cu <bold>#% TVA</bold>}}, prețul întreg al produsului.',
                            [PaymentCurrencyType.RON]:
                              '<bold>ATENTIE!</bold> Suma selectata este <bold>mai mare sau egalǎ</bold> decat <bold>{formattedPriceInRON}</bold> (<bold>{formattedPriceInEUR}</bold> {tvaRate, plural, =0 {farǎ <bold>TVA</bold>} other {cu <bold>#% TVA</bold>}} calculat la <bold>{formattedEUR}</bold> = <bold>{formattedEURToRONRate}</bold>), prețul întreg al produsului.'
                          },
                          min: {
                            [PaymentCurrencyType.EUR]:
                              '<bold>ATENTIE!</bold> Suma selectata este <bold>mai mica</bold> decat <bold>{formattedMinDepositAmountEUR}</bold> ({tvaRate, plural, =0 {farǎ <bold>TVA</bold>} other {cu <bold>#% TVA</bold>}}) minimul pe care trebuie sa-l achite un client ca sa primeasca acces la platforma de curs si la mentor. <bold>Asigura-te ca-l anunti si stie aceste lucruri.</bold>',
                            [PaymentCurrencyType.RON]:
                              '<bold>ATENTIE!</bold> Suma selectata este <bold>mai mica</bold> decat <bold>{formattedMinDepositAmountRON}</bold> (<bold>{formattedMinDepositAmountEUR}</bold> {tvaRate, plural, =0 {farǎ <bold>TVA</bold>} other {cu <bold>#% TVA</bold>}} calculat la <bold>{formattedEUR}</bold> = <bold>{formattedEURToRONRate}</bold>) minimul pe care trebuie sa-l achite un client ca sa primeasca acces la platforma de curs si la mentor. <bold>Asigura-te ca-l anunti si stie aceste lucruri.</bold>'
                          }
                        }
                      },
                      firstPaymentDateAfterDepositOptionId: {
                        info: {
                          [PaymentMethodType.BankTransfer]:
                            '<bold>Pentru transfer bancar:</bold> se genereaza direct ordin on-hold{daysCount, plural, =0 {.} =1 { dupa maxim o zi.} other { dupa maxim # de zile.}}',
                          [PaymentMethodType.Card]:
                            '<bold>Plata cu cardul:</bold> Se debiteaza direct{daysCount, plural, =0 {.} =1 { dupa maxim o zi.} other { dupa maxim # de zile.}}'
                        },
                        placeholder: 'Selecteazǎ data primei plati',
                        title: 'Data primei plati',
                        value:
                          'În maxim {daysCount, plural, =1 {o zi} other {# zile}} card/transfer bancar'
                      },
                      hasDeposit: {
                        title: 'Activează plata avans'
                      }
                    },
                    info: {
                      notice: {
                        [PaymentCurrencyType.EUR]:
                          'Asigura-te că-i transmiti clientului sa aiba pe card o suma mai mare decat suma stabilita ca avans/rata/integral pentru ca pot interveni diverse comisioane bancare sau taxe extra.',
                        [PaymentCurrencyType.RON]:
                          'Pentru plata avansului care deblocheaza accesul la program, pretul s-a calculat astfel: 1 EUR = {eurToRonRate}. Asadar, {formattedMinDepositAmountEUR} = <bold>{formattedMinDepositAmountRON} cu TVA</bold> (suma mimima ce trebuie incasata ca omul sa primeasca acces si la platforma si la mentor). Asigura-te că-i transmiti clientului sa aiba pe card o suma mai mare decat suma stabilita ca avans/rata/integral pentru ca pot interveni diverse comisioane bancare sau taxe extra.'
                      },
                      warning:
                        '<bold>ATENTIE!</bold> In cazul in care clientul achita o suma de avans mai mica de <bold>{formattedMinDepositAmountEUR} cu TVA</bold> primeste acces doar la grupurile de Facebook si WhatsApp (acolo unde exista).'
                    },
                    legend: 'Opțiunea de avans'
                  }
                },
                title: 'Configurare platǎ'
              },
              [CreateProductPaymentLinkFormStep.Confirmation]: {
                description:
                  'Confirmați detaliile pentru crearea link-ului de plată.',
                sections: {
                  deposit: {
                    items: {
                      'deposit-amount': 'Suma avansului',
                      'first-payment-after-deposit': 'Prima platǎ dupa avans',
                      'first-payment-date-after-deposit':
                        'Data primei plati dupa avans'
                    },
                    title: 'Opțiuni de rate'
                  },
                  installments: {
                    items: {
                      'installment-count': 'Număr rate',
                      'installment-price': 'Preț per rată (fără TVA)',
                      'installment-total-price': 'Preț total (fără TVA)'
                    },
                    title: 'Opțiuni de rate'
                  },
                  participants: {
                    items: {
                      caller: 'Caller',
                      client: 'Client',
                      closer: 'Closer',
                      setter: 'Setter'
                    },
                    title: 'Participanți'
                  },
                  payment: {
                    items: {
                      'deposit-amount': 'Suma avans (cu TVA)',
                      'installment-amount-to-pay':
                        'Suma de platǎ per rată (cu TVA)',
                      'installments-count': 'Număr rate',
                      'remaining-amount-to-pay':
                        'Suma rǎmasǎ de platǎ (cu TVA)',
                      'remaining-amount-to-pay-per-installment':
                        'Suma rǎmasǎ de platǎ per rata (cu TVA)',
                      'total-amount-to-pay': 'Suma totalǎ de platǎ (cu TVA)'
                    },
                    title: 'Platǎ'
                  },
                  'payment-info': {
                    items: {
                      currency: 'Monedǎ',
                      'extra-tax-rate': 'Comision extra',
                      'payment-method': 'Metoda de platǎ',
                      'payment-method-values': {
                        [PaymentMethodType.BankTransfer]: 'Transfer bancar',
                        [PaymentMethodType.Card]: 'Card',
                        [PaymentMethodType.TBI]: 'TBI'
                      },
                      'payment-setting-label': 'Setare de platǎ',
                      'tva-rate': 'TVA'
                    },
                    title: 'Detalii platǎ'
                  },
                  product: {
                    items: {
                      contract: 'Contract',
                      'product-name': 'Nume produs',
                      'product-price': 'Preț produs (fără TVA)'
                    },
                    title: 'Produs'
                  }
                },
                title: 'Confirmați detaliile'
              },
              [CreateProductPaymentLinkFormStep.Success]: {
                buttons: {
                  copy: { copied: 'Link copiat', copy: 'Copiază link' },
                  'go-to-payment-links': 'Vezi link-urile de plată',
                  'start-again': 'Începe din nou'
                },
                description:
                  'Link-ul de plată a fost creat cu succes. Acum poți partaja clientului link-ul de plată.',
                title: 'Link-ul de plată a fost creat'
              }
            }
          },
          'payment-links-table': {
            columns: {
              callerEmail: 'Email caller',
              callerName: 'Nume caller',
              closerEmail: 'Email closer',
              closerName: 'Nume closer',
              contract: { name: 'Nume contract' },
              contractId: 'Id contract',
              'copy-link': 'Copiază link',
              createdAt: 'Adǎugat la',
              createdAtValue: 'Adǎugat la (valoare internǎ)',
              createdBy: {
                email: 'Email creator',
                name: 'Nume creator'
              },
              createdById: 'Id creator',
              currency: 'Monedǎ',
              customerEmail: 'Email client',
              customerName: 'Nume client',
              deletedAt: 'Șters la',
              deletedAtValue: 'Șters la (valoare internǎ)',
              depositAmount: 'Suma avansului',
              depositAmountInCents: 'Suma avansului in cenți',
              eurToRonRate: 'Curs EUR/RON',
              expiresAt: 'Expirǎ la',
              expiresAtValue: 'Expirǎ la (valoare internǎ)',
              extensionId: 'Id prelungire',
              extraTaxRate: 'Comision extra',
              firstPaymentDateAfterDeposit: 'Data primei plăți',
              firstPaymentDateAfterDepositValue:
                'Data primei plăți (valoare internǎ)',
              id: 'Id',
              installmentAmountToPay: 'Suma de platǎ per ratǎ',
              installmentAmountToPayInCents: 'Suma de platǎ per ratǎ in cenți',
              installmentId: 'Id ratǎ',
              installmentsCount: 'Numǎr rate',
              membershipId: 'Id membership',
              paymentMethodType: 'Metoda de platǎ',
              paymentMethodTypeValue: 'Metoda de platǎ (valoare internǎ)',
              paymentMethodTypeValues: {
                [PaymentMethodType.BankTransfer]: 'Transfer bancar',
                [PaymentMethodType.Card]: 'Card',
                [PaymentMethodType.TBI]: 'TBI'
              },
              paymentProductType: 'Tip produs',
              paymentProductTypeValue: 'Tip produs (valoare internǎ)',
              paymentProductTypeValues: {
                [PaymentProductType.Product]: 'Produs de bazǎ',
                [PaymentProductType.Extension]: 'Prelungire'
              },
              productId: 'Id produs',
              productName: 'Nume produs',
              remainingAmountToPay: 'Suma rǎmasǎ de platǎ',
              remainingAmountToPayInCents: 'Suma rǎmasǎ de platǎ in cenți',
              remainingInstallmentAmountToPay: 'Suma rǎmasǎ de platǎ per rata',
              remainingInstallmentAmountToPayInCents:
                'Suma rǎmasǎ de platǎ per rata in cenți',
              setterEmail: 'Email setter',
              setterName: 'Numele setter',
              status: 'Status',
              statusValue: 'Status (valoare internǎ)',
              statusValues: {
                [PaymentStatusType.Created]: 'Creat',
                [PaymentStatusType.Processing]: 'În procesare',
                [PaymentStatusType.Succeeded]: 'Plătit',
                [PaymentStatusType.RequiresConfirmation]: 'Necesitǎ confirmare',
                [PaymentStatusType.RequiresAction]: 'Necesitǎ acțiune',
                [PaymentStatusType.RequiresCapture]: 'Necesitǎ captură',
                [PaymentStatusType.Canceled]: 'Anulat',
                [PaymentStatusType.Expired]: 'Expirat',
                [PaymentStatusType.PaymentFailed]: 'Eșuat',
                [PaymentStatusType.RequiresPaymentMethod]:
                  'Necesitǎ metoda plată'
              },
              totalAmountToPay: 'Suma totalǎ de platǎ',
              totalAmountToPayInCents: 'Suma totalǎ de platǎ in cenți',
              tvaRate: 'TVA',
              type: 'Tip platǎ',
              typeValue: 'Tip platǎ (valoare internǎ)',
              typeValues: {
                [PaymentLinkType.Integral]: 'Integral',
                [PaymentLinkType.Deposit]: 'Avans',
                [PaymentLinkType.Installments]: 'Rate',
                [PaymentLinkType.InstallmentsDeposit]: 'Rate cu avans'
              },
              updatedAt: 'Actualizat la',
              updatedAtValue: 'Actualizat la (valoare internǎ)'
            },
            header: {
              actions: {
                title: 'Acțiuni',
                values: {
                  create: 'Adaugă',
                  download: 'Descarcă'
                }
              },
              columns: {
                title: 'Coloane'
              },
              input: {
                placeholder: 'Caută link de platǎ'
              },
              show: {
                groups: {
                  'created-by': {
                    title: 'Create de utilizator',
                    values: {
                      all: 'Toate',
                      'by-me': 'Create de mine'
                    }
                  },

                  'expiration-status': {
                    title: 'Status expirare',
                    values: {
                      active: 'Active',
                      all: 'Toate',
                      expired: 'Expirate'
                    }
                  },
                  'payment-product-type': {
                    title: 'Tip produs',
                    values: {
                      all: 'Toate',
                      [PaymentProductType.Product]: 'Produs de bazǎ',
                      [PaymentProductType.Extension]: 'Prelungire'
                    }
                  },
                  status: {
                    title: 'Status',
                    values: {
                      all: 'Toate',
                      [PaymentStatusType.Created]: 'Creat',
                      [PaymentStatusType.Processing]: 'În procesare',
                      [PaymentStatusType.Succeeded]: 'Plătit',
                      [PaymentStatusType.RequiresConfirmation]:
                        'Necesitǎ confirmare',
                      [PaymentStatusType.RequiresAction]: 'Necesitǎ acțiune',
                      [PaymentStatusType.RequiresCapture]: 'Necesitǎ captură',
                      [PaymentStatusType.Canceled]: 'Anulat',
                      [PaymentStatusType.Expired]: 'Expirat',
                      [PaymentStatusType.PaymentFailed]: 'Eșuat',
                      [PaymentStatusType.RequiresPaymentMethod]:
                        'Necesitǎ metoda plată'
                    }
                  }
                },
                title: 'Afișează'
              }
            },
            'no-results': 'Nu s-au găsit link-uri de plată.',
            pagination: {
              'next-page': 'Pagina următoare',
              'page-count': 'Pagina {page} din {pageCount}',
              'previous-page': 'Pagina anterioară',
              'rows-per-page': 'Rânduri pe pagină'
            },
            row: {
              actions: {
                values: {
                  copied: 'Copiat',
                  copy: 'Copiază'
                }
              },
              status: {
                [PaymentStatusType.Created]: 'Creat',
                [PaymentStatusType.Processing]: 'În procesare',
                [PaymentStatusType.Succeeded]: 'Plătit',
                [PaymentStatusType.RequiresConfirmation]: 'Necesitǎ confirmare',
                [PaymentStatusType.RequiresAction]: 'Necesitǎ acțiune',
                [PaymentStatusType.RequiresCapture]: 'Necesitǎ captură',
                [PaymentStatusType.Canceled]: 'Anulat',
                [PaymentStatusType.Expired]: 'Expirat',
                [PaymentStatusType.PaymentFailed]: 'Eșuat',
                [PaymentStatusType.RequiresPaymentMethod]:
                  'Necesitǎ metoda plată'
              }
            }
          }
        }
      },
      subscriptions: {
        _components: {
          'cancel-subscription-dialog': {
            alert: {
              description:
                'Această acțiune va anula imediat subscripția și orice membership asociat. Clientul va pierde accesul la tot conținutul imediat.',
              title: 'Atenție: Anulare imediată'
            },
            buttons: {
              cancel: 'Anulează',
              submit: {
                default: 'Anulează subscripție',
                loading: 'Se anulează...'
              }
            },
            description: {
              default: 'Alege cum să anulezi subscripția.',
              'with-customer':
                'Alege cum să anulezi subscripția pentru {customerName}.'
            },
            fields: {
              'cancel-type': {
                legend: 'Tipul anulării',
                options: {
                  graceful: {
                    description:
                      'Subscripția va rămâne activǎ până la {date}. Clientul păstrează accesul până atunci.',
                    'description-fallback':
                      'Subscripția va rămâne activǎ până la sfârșitul perioadei curente de facturare. Clientul păstrează accesul până atunci.',
                    label: 'Anulare treptată'
                  },
                  immediate: {
                    description:
                      'Subscripția și membership-ul vor fi anulate imediat. Clientul pierde accesul imediat.',
                    label: 'Anulare imediată'
                  }
                }
              }
            },
            title: 'Anulează subscripție',
            toast: {
              error: {
                description: 'A apărut o eroare neașteptată',
                title: 'Nu s-a putut anula subscripția'
              },
              success: {
                title: 'Subscripție anulată'
              }
            }
          },
          'reschedule-payment-dialog': {
            alert: {
              description:
                'Când reprogramezi această plată, toate plățile viitoare vor fi ajustate automat pentru a menține un interval de 30 de zile de la noua dată.',
              title: 'Cascadă automată'
            },
            buttons: {
              cancel: 'Anulează',
              submit: {
                default: 'Reprogramează plată',
                loading: 'Se reprogramează...'
              }
            },
            description: {
              default: 'Alege o nouă dată de plată pentru această subscripție.',
              'with-customer':
                'Alege o nouă dată de plată pentru subscripția lui {customerName}.'
            },
            fields: {
              'new-payment-date': {
                description: {
                  'current-date': 'Data curentă de plată: {date}',
                  'select-future':
                    'Selectează o dată viitoare pentru următoarea plată'
                },
                label: 'Noua dată de plată',
                placeholder: 'Selectează data'
              }
            },
            title: 'Reprogramează plată',
            toast: {
              error: {
                description: 'A apărut o eroare neașteptată',
                title: 'Nu s-a putut reprograma plata'
              },
              success: {
                description:
                  'Data următoarei plăți a fost actualizată. Plățile viitoare vor fi ajustate automat.',
                title: 'Plată reprogramată'
              }
            }
          },
          'set-on-hold-dialog': {
            alert: {
              description:
                'Când pui această subscripție în așteptare, orice membership asociat va fi setat automat la statusul "Pauză". Clientul va pierde accesul până când subscripția este reactivată.',
              title: 'Atenție: Membership-ul va fi pus în pauză'
            },
            buttons: {
              cancel: 'Anulează',
              submit: {
                default: 'Pune în așteptare',
                loading: 'Se pune în așteptare...'
              }
            },
            description: {
              default: 'Aceasta va pune subscripția în pauză.',
              'with-customer':
                'Aceasta va pune în pauză subscripția pentru {customerName}.'
            },
            title: 'Pune subscripție în așteptare',
            toast: {
              error: {
                description: 'A apărut o eroare neașteptată',
                title: 'Nu s-a putut pune subscripția în așteptare'
              },
              success: {
                description:
                  'Subscripția a fost pusă în pauză și membership-ul va fi pus în pauză automat',
                title: 'Subscripție pusă în așteptare'
              }
            }
          },
          'subscriptions-table': {
            actions: {
              'cancel-subscription': 'Anulează subscripție',
              'reschedule-payment': 'Reprogramează plată',
              'set-on-hold': 'Pune în așteptare',
              title: 'Acțiuni'
            },
            alerts: {
              'payment-failures': {
                badge: '{count} eșuate',
                'last-attempt': 'Ultima încercare: {date}',
                'last-reason': 'Ultimul motiv: {reason}',
                title: 'Eșecuri de plată'
              },
              'scheduled-cancellation': {
                badge: 'Programată',
                message: 'Va fi anulată la: {date}',
                title: 'Anulare programată'
              },
              title: 'Alerte'
            },
            columns: {
              createdAt: 'Creat la',
              customerEmail: 'Email client',
              customerName: 'Nume client',
              extensionId: 'Id prelungire',
              id: 'Id',
              membershipId: 'Id membership',
              nextPaymentDate: 'Data urmǎtoarei plǎti',
              parentOrderId: 'Id comanda',
              paymentMethod: 'Metoda de platǎ',
              paymentMethodValues: {
                [PaymentMethodType.BankTransfer]: 'Transfer bancar',
                [PaymentMethodType.Card]: 'Card',
                [PaymentMethodType.TBI]: 'TBI'
              },
              productId: 'Id produs',
              productName: 'Nume produs',
              productPaymentType: 'Tip produs',
              productPaymentTypeValues: {
                [PaymentProductType.Product]: 'Produs de bazǎ',
                [PaymentProductType.Extension]: 'Prelungire'
              },
              remainingPayments: 'Rate rǎmase',
              startDate: 'Data început',
              status: 'Status',
              statusValues: {
                [SubscriptionStatusType.Active]: 'Activǎ',
                [SubscriptionStatusType.OnHold]: 'În așteptare',
                [SubscriptionStatusType.Cancelled]: 'Anulatǎ',
                [SubscriptionStatusType.Completed]: 'Completatǎ'
              },
              updatedAt: 'Actualizat la'
            },
            header: {
              actions: {
                title: 'Acțiuni',
                values: {
                  download: 'Descarcă'
                }
              },
              columns: {
                title: 'Coloane'
              },
              input: {
                placeholder: 'Caută subscripție'
              },
              show: {
                groups: {
                  'created-by': {
                    title: 'Create de utilizator',
                    values: {
                      all: 'Toate',
                      'by-me': 'Create de mine'
                    }
                  },
                  'payment-method': {
                    title: 'Metoda de platǎ',
                    values: {
                      all: 'Toate',
                      [PaymentMethodType.Card]: 'Card',
                      [PaymentMethodType.BankTransfer]: 'Transfer bancar',
                      [PaymentMethodType.TBI]: 'TBI'
                    }
                  },
                  'product-payment-type': {
                    title: 'Tip produs',
                    values: {
                      all: 'Toate',
                      [PaymentProductType.Product]: 'Produs de bazǎ',
                      [PaymentProductType.Extension]: 'Prelungire'
                    }
                  },
                  status: {
                    title: 'Status',
                    values: {
                      all: 'Toate',
                      [SubscriptionStatusType.Active]: 'Activǎ',
                      [SubscriptionStatusType.OnHold]: 'În așteptare',
                      [SubscriptionStatusType.Cancelled]: 'Anulatǎ',
                      [SubscriptionStatusType.Completed]: 'Completatǎ'
                    }
                  }
                },
                title: 'Afișează'
              }
            },
            'no-results': 'Nu s-au găsit subscripții.',
            pagination: {
              'next-page': 'Pagina următoare',
              'page-count': 'Pagina {page} din {pageCount}',
              'previous-page': 'Pagina anterioară',
              'rows-per-page': 'Rânduri pe pagină'
            }
          }
        }
      }
    },
    '(auth)': {
      'sign-in': {
        description: 'Autentifică-te pentru a accesa contul tău.',

        form: {
          buttons: {
            submit: {
              default: 'Autentifică-te',
              loading: 'Se autentifică...'
            }
          },
          fields: {
            email: {
              placeholder: 'Introduceți adresa de e-mail',
              title: 'Adresa de e-mail'
            }
          },

          response: {
            error: {
              description:
                'A apărut o eroare la trimiterea link-ului de autentificare.',
              title: 'Trimitere eșuată'
            },
            success: {
              description:
                'Link-ul de autentificare a fost trimis la adresa de e-mail.',
              title: 'Trimitere reușită'
            }
          }
        },
        title: 'Autentificare'
      }
    }
  },

  pages: {
    'sent-email': {
      description: 'Am trimis un link de autentificare sigur la',
      header: 'Verificați inbox-ul dumneavoastră.',
      paragraph: 'Puteți închide această fereastră.'
    },
    // 'users-accounts': {
    //   title: 'Conturi utilizatori',
    //   table: {
    //     header: {
    //       'filter-emails': 'Filtrează e-mailurile',

    //       columns: 'Coloane',

    //       show: {
    //         title: 'Afișează',

    //         options: {
    //           'show-admins': 'Afișează admini',
    //           'show-banned-users': 'Afișează utilizatorii banați'
    //         }
    //       },

    //       'table-actions': {
    //         'create-user': 'Adaugă utilizator',
    //         'import-users': 'Importă utilizatori',
    //         'export-users': 'Exportă utilizatori',
    //         'remove-users': 'Șterge utilizatori'
    //       }
    //     },

    //     columns: {
    //       id: 'Id',
    //       name: 'Nume',
    //       email: 'E-mail',
    //       emailVerified: 'E-mail verificat',
    //       role: 'Rol',
    //       [`role-${UserRoles.ADMIN}`]: 'Admin',
    //       [`role-${UserRoles.USER}`]: 'Reprezentant sales',
    //       [`role-${UserRoles.SUPER_ADMIN}`]: 'Super admin',
    //       createdAt: 'Adăugat la',
    //       updatedAt: 'Actualizat la',
    //       banned: 'Banat',
    //       bannedStatus: 'Este banat',
    //       banExpires: 'Banat până la',
    //       notBannedStatus: 'Nu este banat'
    //     },

    //     'row-actions': {
    //       update: {
    //         'edit-user': 'Modifică utilizatorul',
    //         'unban-user': 'Debanează utilizatorul',
    //         'promote-to-admin': 'Promotează la admin',
    //         'demote-to-user': 'Demotează la user'
    //       },
    //       destructive: {
    //         'ban-user': 'Banează utilizatorul',
    //         'remove-user': 'Șterge utilizatorul'
    //       }
    //     }
    //   }
    // },

    'sign-in': {
      description: 'Autentifică-te pentru a accesa contul tău.',
      title: 'Autentificare'
    }
  },

  validation: {
    shared: {
      protected: {
        'update-email': {
          newEmail: 'Noua adresă de e-mail este invalidă.'
        }
      },
      public: {
        'sign-in': {
          email: 'Adresa de e-mail este invalidă.'
        }
      },
      user: {
        email: 'Adresa de e-mail este invalidă.',
        firstName: 'Prenumele este invalid.',
        lastName: 'Numele este invalid.'
      }
    }
  }
} as const

export default dictionary
