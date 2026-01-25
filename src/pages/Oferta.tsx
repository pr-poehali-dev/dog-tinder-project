import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';

export default function Oferta() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-6"
        >
          <Icon name="ArrowLeft" size={20} className="mr-2" />
          Назад на главную
        </Button>

        <div className="bg-card rounded-lg shadow-lg p-8">
          <h1 className="text-4xl font-fredoka font-bold mb-8 text-center bg-gradient-to-r from-[#FF5733] to-[#FFA500] bg-clip-text text-transparent">
            Публичная оферта
          </h1>

          <div className="prose prose-lg max-w-none space-y-6 text-foreground">
            <section>
              <h2 className="text-2xl font-semibold mb-4">1. Общие положения</h2>
              <p className="text-muted-foreground leading-relaxed">
                Настоящий документ представляет собой публичную оферту Индивидуального предпринимателя 
                Зенкова Артёма Алексеевича (далее — "Исполнитель") на оказание информационных услуг 
                через онлайн-платформу поиска пар для животных.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. Предмет договора</h2>
              <p className="text-muted-foreground leading-relaxed">
                Исполнитель предоставляет Пользователю доступ к информационной платформе для размещения 
                объявлений о поиске пары для животных, а также оказывает дополнительные платные услуги, 
                перечисленные на сайте.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. Стоимость услуг</h2>
              <p className="text-muted-foreground leading-relaxed mb-2">
                Стоимость услуг указана на сайте в разделе "Платные услуги". Исполнитель вправе 
                изменять стоимость услуг в одностороннем порядке с уведомлением Пользователей 
                за 7 календарных дней.
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Проверка документов — 500 ₽</li>
                <li>Сопровождение ветеринара — 7 500 ₽</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. Порядок оплаты</h2>
              <p className="text-muted-foreground leading-relaxed">
                Оплата услуг производится через платежную систему Robokassa. После успешной оплаты 
                Пользователь получает доступ к выбранной услуге в соответствии с её описанием.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Права и обязанности сторон</h2>
              <div className="space-y-3">
                <p className="text-muted-foreground leading-relaxed">
                  <strong>Исполнитель обязуется:</strong>
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li>Обеспечить работоспособность платформы</li>
                  <li>Предоставить оплаченные услуги в полном объеме</li>
                  <li>Обеспечить конфиденциальность данных Пользователей</li>
                </ul>

                <p className="text-muted-foreground leading-relaxed mt-4">
                  <strong>Пользователь обязуется:</strong>
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li>Предоставлять достоверную информацию о питомце</li>
                  <li>Своевременно оплачивать выбранные услуги</li>
                  <li>Не нарушать законодательство РФ при использовании платформы</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Ответственность сторон</h2>
              <p className="text-muted-foreground leading-relaxed">
                Исполнитель не несет ответственности за результат взаимодействия Пользователей 
                между собой, здоровье животных и последствия сделок, совершенных вне платформы.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">7. Возврат средств</h2>
              <p className="text-muted-foreground leading-relaxed">
                Возврат оплаченных услуг возможен в течение 14 дней с момента оплаты при условии, 
                что услуга не была оказана. Для возврата необходимо направить заявление на email 
                Исполнителя.
              </p>
            </section>

            <section className="bg-secondary/30 rounded-lg p-6 mt-8">
              <h2 className="text-2xl font-semibold mb-4">Реквизиты Исполнителя</h2>
              <div className="space-y-2 text-muted-foreground">
                <p><strong>Полное наименование:</strong> Зенков Артём Алексеевич</p>
                <p><strong>ИНН:</strong> 352530610340</p>
                <p><strong>ОГРНИП:</strong> 325350000051398</p>
                <p><strong>Контактный телефон:</strong> <a href="tel:+79114494731" className="text-primary hover:underline">+7 911 449-47-31</a></p>
                <p><strong>Контактный e-mail:</strong> <a href="mailto:artzen2016@yandex.ru" className="text-primary hover:underline">artzen2016@yandex.ru</a></p>
              </div>
            </section>

            <section className="mt-8 pt-6 border-t border-border">
              <p className="text-sm text-muted-foreground text-center">
                Настоящая оферта вступает в силу с момента её публикации на сайте 
                и действует до момента её отзыва Исполнителем.
              </p>
              <p className="text-sm text-muted-foreground text-center mt-2">
                Дата публикации: 12 января 2026 года
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}