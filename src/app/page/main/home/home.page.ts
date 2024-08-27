import { Component, inject, OnInit } from '@angular/core';
import { Product } from 'src/app/models/product.model';
import { User } from 'src/app/models/user.model';
import { FirebaseService } from 'src/app/services/firebase.service';
import { UtilsService } from 'src/app/services/utils.service';
import { AddUpdateProductComponent } from 'src/app/shared/components/add-update-product/add-update-product.component';
import { orderBy, where } from 'firebase/firestore';


@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit {

  firebaseSvc = inject(FirebaseService);
  utilsSvc = inject(UtilsService);



  products: Product[] = [];
  loading: boolean = false;

  ngOnInit() {
  }

  user(): User {
    return this.utilsSvc.getFromLocalStorage('user');
  }

  ionViewWillEnter() {
    this.getProducts();
  }


  //========funcion para actualizar la página y refrescar===========
  doRefresh(event) {
    setTimeout(() => {
      this.getProducts();
      event.target.complete();
    }, 1000);
  }

  //=======Obtener ganancias=====
  getProfits() {
    return this.products.reduce((index, product) => index + product.price * product.soldUnits, 0)
  }


  //=======obtener productos======
  getProducts() {
    let path = `users/${this.user().uid}/products`;

    this.loading = true;

    let query = [
      orderBy('soldUnits', 'desc'),
      //where('soldUnits', '>', 5)
    ]




    let sub = this.firebaseSvc.getColletionData(path, query).subscribe({
      next: (res: any) => {
        console.log(res);
        this.products = res;

        this.loading = false;

        sub.unsubscribe();
      }
    })
  }

  //=======Agregar o actualizar  producto===
  async addUpdateProduct(product?: Product) {

    let success = await this.utilsSvc.presentModal({
      component: AddUpdateProductComponent,
      cssClass: 'add-update-modal',
      componentProps: { product }
    })

    if (success) this.getProducts();
  }
  //========Confirmar eliminacion del Producto=======
  async confirmDeleteProduct(product: Product) {
    this.utilsSvc.presentAlert({
      header: 'Eliminar Producto',
      message: '¿Quieres eliminar este producto?',
      mode: 'ios',
      buttons: [
        {
          text: 'Cancelar',
        }, {
          text: 'Si eliminar',
          handler: () => {
            this.deleteProduct(product)
          }
        }
      ]
    });

  }


  //===============Eliminar producto=======================
  async deleteProduct(product: Product) {

    let path = `users/${this.user().uid}/products/${product.id}`

    const loading = await this.utilsSvc.loading();
    await loading.present();

    let imagePath = await this.firebaseSvc.getFilePath(product.image);
    await loading.present();

    this.firebaseSvc.deleteDocument(path).then(async res => {

      this.products = this.products.filter(p => p.id !== product.id);

      this.utilsSvc.presentToast({
        message: 'Producto eliminado exitosamente',
        duration: 1500,
        color: 'success',
        position: 'middle',
        icon: 'checkmark-circle-out-line'
      })



    }).catch(error => {
      console.log(error);

      this.utilsSvc.presentToast({
        message: error.message,
        duration: 2500,
        color: 'primary',
        position: 'middle',
        icon: 'alert-circle-out-line'
      })


    }).finally(() => {
      loading.dismiss();
    })


  }

}
