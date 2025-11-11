import { CreateProductPaymentLinkFormStep } from '~/client/modules/(app)/payment-links/create/create-product-payment-link-form/stepper/config'
import { CheckoutFormSection } from '~/client/modules/checkout/checkout-form/schema'
import { CheckoutFormStep } from '~/client/modules/checkout/checkout-form/stepper/config'
import { CreateProductPaymentLinkFormSection } from '~/shared/create-product-payment-link-form/enums/create-product-payment-link-form-sections'
import { OrderStatusType } from '~/shared/enums/order-status-type'
import { OrderType } from '~/shared/enums/order-type'
import { PaymentCurrencyType } from '~/shared/enums/payment-currency-type'
import { PaymentMethodType } from '~/shared/enums/payment-method-type'
import { PaymentProductType } from '~/shared/enums/payment-product-type'
import { PaymentStatusType } from '~/shared/enums/payment-status'
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
                    count: 'Număr de rate',
                    pricePerInstallment: 'Preț per rată',
                    totalPrice: 'Preț total'
                  },
                  title: 'Opțiuni de rate'
                },
                title: 'Opțiuni de prelungiri'
              },

              installments: {
                count: 'Număr de rate',
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
                  count: 'Număr de rate',
                  pricePerInstallment: 'Preț per rată',
                  totalPrice: 'Preț total'
                },
                title: 'Opțiuni de rate'
              },
              title: 'Opțiuni de prelungiri'
            },

            installments: {
              count: 'Număr de rate',
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
                      header: 'Număr de rate',
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
                      header: 'Număr de rate',
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
          //         title: 'Durata abonamentului (în luni)',
          //         placeholder: 'Introduceți durata abonamentului',
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
          //         title: 'Durata abonamentului (în luni)',
          //         placeholder: 'Introduceți durata abonamentului',
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
                banExpiresValue: 'Banat până la (valoare interna)',
                banned: 'Status ban',
                createdAt: 'Adăugat la',
                createdAtValue: 'Adăugat la (valoare interna)',
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
                updatedAtValue: 'Actualizat la (valoare interna)'
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
                  routes: {
                    create: { title: 'Creează link de plată' }
                  },
                  title: 'Link-uri de plată'
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
          'memberships-table': {
            columns: {
              createdAt: 'Creat la',
              delayedStartDate: 'Data de început întârziată',
              endDate: 'Data de încheiere',
              id: 'Id',
              parentOrderId: 'Id comanda',
              startDate: 'Data de început',
              status: 'Status',
              updatedAt: 'Actualizat la'
              // product: {
              //   name: 'Nume produs'
              // },
              // installmentsOption: {
              //   installments: 'Rate'
              // },
              // depositAmountInRON: 'Avans de plată',
              // firstPaymentDateAfterDeposit: 'Data primei plăți',
              // firstPaymentDateValue: 'Data primei plăți (valoare interna)',
              // amountToPay: 'Suma de plată',
              // createdBy: {
              //   name: 'Nume creator',
              //   email: 'Email creator'
              // },
              // expiresAt: 'Expirǎ la',
              // expiresAtValue: 'Expirǎ la (valoare interna)',
              // createdAt: 'Creat la',
              // createdAtValue: 'Creat la (valoare interna)',
              // customerEmail: 'Email client',
              // customerFirstName: 'Prenume client',
              // customerLastName: 'Nume client',
              // customerPhoneNumber: 'Număr de telefon client',
              // id: 'Id',
              // parentOrder: { id: 'Id comanda' },
              // status: 'Status'
            },
            header: {
              actions: {
                title: 'Acțiuni',
                values: {
                  download: 'Descarcă'
                }
              },
              // show: {
              //   title: 'Afișează',
              //   groups: {
              //     'created-by': {
              //       title: 'Create de utilizator',
              //       values: {
              //         all: 'Toate',
              //         'by-me': 'Create de mine'
              //       }
              //     }
              //   }
              // },
              columns: {
                title: 'Coloane'
              }
            },
            'no-results': 'Nu s-au găsit membership-uri.',
            pagination: {
              'next-page': 'Pagina următoare',
              'page-count': 'Pagina {page} din {pageCount}',
              'previous-page': 'Pagina anterioară',
              'rows-per-page': 'Rânduri pe pagină'
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
            'select-product-and-meeting': {
              description:
                'Alege un produs și o întâlnire pentru care se va crea link-ul de plată.',

              fields: {
                'meeting-select': {
                  placeholder: 'Selecteazǎ o întâlnire',
                  title: 'Alege o întâlnire',
                  values: {
                    'not-found': 'Nu s-a gǎsit nicio întâlnire',
                    placeholder: 'Cautǎ o întâlnire',
                    status: {
                      active: 'Activǎ',
                      canceled: 'Anulatǎ'
                    }
                  }
                },
                'product-select': {
                  placeholder: 'Selecteazǎ un produs',
                  title: 'Alege un produs'
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
              // callerName: 'Nume apelant',
              // createdAt: 'Plasatǎ la',
              // createdBy: {
              //   email: 'Email creator',
              //   name: 'Nume creator'
              // },
              // customerEmail: 'Email client',
              // customerFirstName: 'Prenume client',
              // customerLastName: 'Nume client',
              // customerPhoneNumber: 'Număr de telefon client',
              // id: 'Id',
              // paidAmount: 'Suma plătită',
              // paidAmountWithoutTVA: 'Suma plătită fără TVA',
              // paymentMethod: 'Metodă de plată',
              // product: {
              //   name: 'Nume produs'
              // },
              // setterName: 'Nume setator',
              // status: 'Status',
              // tvaAmount: 'Valoare TVA',
              // type: 'Tip'
              createdAt: 'Creat la',
              customerEmail: 'Email client',
              customerName: 'Nume client',
              extensionPaymentLinkId: 'Id link de plată prelungire',
              id: 'Id',
              productPaymentLinkId: 'Id link de plată produs',
              status: 'Status',
              stripePaymentIntentId: 'Id Stripe',
              type: 'Tip',
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
              show: {
                groups: {
                  'created-by': {
                    title: 'Create de utilizator',
                    values: {
                      all: 'Toate',
                      'by-me': 'Create de mine'
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
          'create-payment-link-form': {
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
                description:
                  'Configurați detaliile de bazǎ pentru crearea link-ului de platǎ.',
                forms: {
                  [CreateProductPaymentLinkFormSection.Participants]: {
                    description:
                      'Alege participanții pentru care se va crea link-ul de plată.',
                    fields: {
                      callerName: {
                        placeholder: 'Introduceți numele caller-ului',
                        title: 'Nume caller'
                      },
                      meetingId: {
                        placeholder: 'Selecteazǎ o întâlnire',
                        title: 'Alege o întâlnire',
                        values: {
                          'not-found': 'Nu s-a gǎsit nicio întâlnire',
                          placeholder: 'Cautǎ o întâlnire',
                          status: {
                            active: 'Activǎ',
                            canceled: 'Anulatǎ'
                          }
                        }
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
              amountToPay: 'Suma de plată',
              createdAt: 'Creat la',
              createdAtValue: 'Creat la (valoare interna)',
              createdBy: {
                email: 'Email creator',
                name: 'Nume creator'
              },
              customerEmail: 'Email client',
              customerName: 'Nume client',
              depositAmount: 'Avans de plată',
              expiresAt: 'Expirǎ la',
              expiresAtValue: 'Expirǎ la (valoare interna)',
              firstPaymentDateAfterDeposit: 'Data primei plăți',
              firstPaymentDateValue: 'Data primei plăți (valoare interna)',
              id: 'Id',
              installments: 'Rate',
              productName: 'Nume produs',
              status: 'Status'
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
                [PaymentStatusType.Created]: 'În așteptare',
                [PaymentStatusType.Processing]: 'În procesare',
                [PaymentStatusType.Succeeded]: 'Plătit',
                [PaymentStatusType.PaymentFailed]: 'Eșuat',
                [PaymentStatusType.RequiresPaymentMethod]: 'În așteptare plată',
                [PaymentStatusType.RequiresConfirmation]:
                  'În așteptare confirmare',
                [PaymentStatusType.RequiresAction]: 'În așteptare acțiune',
                [PaymentStatusType.RequiresCapture]: 'În așteptare captură',
                [PaymentStatusType.Canceled]: 'Anulat',
                [PaymentStatusType.Expired]: 'Expirat'
              }
            }
          }
        }
      },
      subscriptions: {
        _components: {
          'subscriptions-table': {
            columns: {
              createdAt: 'Creat la',
              customerEmail: 'Email client',
              customerName: 'Nume client',
              extensionId: 'Id prelungire',
              id: 'Id',
              membershipId: 'Id membru',
              nextPaymentDate: 'Data urmǎtoarei plǎti',
              parentOrderId: 'Id comanda',
              paymentMethod: 'Metoda de platǎ',
              productId: 'Id produs',
              remainingPayments: 'Rate rǎmase',
              startDate: 'Data început',
              status: 'Status',
              updatedAt: 'Actualizat la'
              // createdAt: 'Creat la',
              // createdAtValue: 'Creat la (valoare interna)',
              // customerEmail: 'Email client',
              // customerFirstName: 'Prenume client',
              // customerLastName: 'Nume client',
              // customerPhoneNumber: 'Număr de telefon client',
              // id: 'Id',
              // parentOrder: { id: 'Id comanda' },
              // status: 'Status'
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
              }
            },
            'no-results': 'Nu s-au găsit subscriptii.',
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
